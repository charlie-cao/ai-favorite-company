/**
 * FavAI Landing Page JavaScript
 * 高转化率优化和用户体验增强
 */

class LandingPage {
    constructor() {
        this.init();
        this.setupEventListeners();
        this.initAnimations();
        this.trackUserBehavior();
    }

    init() {
        // 页面加载完成初始化
        this.mobileMenuOpen = false;
        this.isYearlyPricing = false;
        this.currentStep = 1;
        
        // 性能监控
        this.loadTime = performance.now();
        
        // 用户行为跟踪
        this.userActions = [];
        this.scrollDepth = 0;
        this.timeOnPage = Date.now();
        
        console.log('FavAI Landing Page initialized');
    }

    setupEventListeners() {
        // 移动端菜单
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        if (mobileToggle) {
            mobileToggle.addEventListener('click', () => this.toggleMobileMenu());
        }

        // 平滑滚动
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => this.handleSmoothScroll(e));
        });

        // 价格切换
        const pricingToggle = document.querySelector('.toggle-switch');
        if (pricingToggle) {
            pricingToggle.addEventListener('click', () => this.togglePricing());
        }

        // FAQ 手风琴
        document.querySelectorAll('.faq-question').forEach(question => {
            question.addEventListener('click', () => this.toggleFAQ(question));
        });

        // CTA 按钮点击跟踪
        document.querySelectorAll('.cta-main').forEach(btn => {
            btn.addEventListener('click', () => this.trackCTA('main_cta'));
        });

        // 演示步骤切换
        document.querySelectorAll('.step-item').forEach(step => {
            step.addEventListener('click', () => this.switchDemoStep(step));
        });

        // 视频播放按钮
        const playButton = document.querySelector('.play-button');
        if (playButton) {
            playButton.addEventListener('click', () => this.playDemo());
        }

        // 滚动监听
        window.addEventListener('scroll', () => this.handleScroll());
        
        // 页面可见性变化
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());

        // 退出意图检测
        document.addEventListener('mouseleave', () => this.handleExitIntent());

        // 表单提交（如果有）
        document.querySelectorAll('form').forEach(form => {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        });

        // 键盘导航
        document.addEventListener('keydown', (e) => this.handleKeyboardNav(e));
    }

    initAnimations() {
        // 滚动动画观察器
        this.observeElements();
        
        // 页面加载动画
        this.animateOnLoad();
        
        // 数字动画
        this.animateCounters();
    }

    observeElements() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                    
                    // 跟踪用户查看的section
                    this.trackSectionView(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        });

        // 观察所有主要section
        document.querySelectorAll('section, .feature-card, .testimonial-card, .pricing-card').forEach(el => {
            observer.observe(el);
        });
    }

    animateOnLoad() {
        // 延迟添加动画类，创建加载效果
        setTimeout(() => {
            document.querySelector('.hero-title')?.classList.add('slide-up');
        }, 100);
        
        setTimeout(() => {
            document.querySelector('.hero-subtitle')?.classList.add('slide-up');
        }, 200);
        
        setTimeout(() => {
            document.querySelector('.hero-actions')?.classList.add('slide-up');
        }, 300);
    }

    animateCounters() {
        const counters = document.querySelectorAll('.stat-number, .price-amount');
        counters.forEach(counter => {
            const observer = new IntersectionObserver(entries => {
                if (entries[0].isIntersecting) {
                    this.countUp(counter);
                    observer.disconnect();
                }
            });
            observer.observe(counter);
        });
    }

    countUp(element) {
        const target = parseInt(element.textContent.replace(/,/g, ''));
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;

        const timer = setInterval(() => {
            current += step;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current).toLocaleString();
        }, 16);
    }

    toggleMobileMenu() {
        this.mobileMenuOpen = !this.mobileMenuOpen;
        const toggle = document.querySelector('.mobile-menu-toggle');
        const menu = document.querySelector('.nav-menu');
        
        toggle.setAttribute('aria-expanded', this.mobileMenuOpen);
        
        if (this.mobileMenuOpen) {
            // 显示移动菜单的逻辑
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        
        this.trackUserAction('mobile_menu_toggle', { open: this.mobileMenuOpen });
    }

    handleSmoothScroll(e) {
        e.preventDefault();
        const targetId = e.target.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            const offsetTop = targetElement.offsetTop - 80; // 考虑固定导航栏
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
            
            this.trackUserAction('smooth_scroll', { target: targetId });
        }
    }

    togglePricing() {
        this.isYearlyPricing = !this.isYearlyPricing;
        const toggle = document.querySelector('.toggle-switch');
        const amounts = document.querySelectorAll('.price-amount');
        
        toggle.classList.toggle('active', this.isYearlyPricing);
        
        amounts.forEach(amount => {
            const monthly = amount.dataset.monthly;
            const yearly = amount.dataset.yearly;
            
            if (monthly && yearly) {
                amount.textContent = this.isYearlyPricing ? yearly : monthly;
            }
        });
        
        this.trackUserAction('pricing_toggle', { yearly: this.isYearlyPricing });
    }

    toggleFAQ(question) {
        const isExpanded = question.getAttribute('aria-expanded') === 'true';
        
        // 关闭所有其他FAQ
        document.querySelectorAll('.faq-question').forEach(q => {
            if (q !== question) {
                q.setAttribute('aria-expanded', 'false');
            }
        });
        
        // 切换当前FAQ
        question.setAttribute('aria-expanded', !isExpanded);
        
        this.trackUserAction('faq_toggle', { 
            question: question.textContent.trim(),
            expanded: !isExpanded 
        });
    }

    switchDemoStep(stepElement) {
        // 移除所有active类
        document.querySelectorAll('.step-item').forEach(step => {
            step.classList.remove('active');
        });
        
        // 添加active类到选中的步骤
        stepElement.classList.add('active');
        
        const stepNumber = stepElement.dataset.step;
        this.currentStep = parseInt(stepNumber);
        
        this.trackUserAction('demo_step_change', { step: this.currentStep });
    }

    playDemo() {
        // 这里可以集成实际的视频播放逻辑
        alert('演示视频将在这里播放。实际实现中，这里会打开视频播放器或跳转到演示页面。');
        
        this.trackUserAction('demo_play', { timestamp: Date.now() });
    }

    handleScroll() {
        const scrolled = window.pageYOffset;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrolled / maxScroll) * 100;
        
        // 更新最大滚动深度
        if (scrollPercent > this.scrollDepth) {
            this.scrollDepth = scrollPercent;
        }
        
        // 导航栏背景变化
        const header = document.querySelector('.header');
        if (scrolled > 100) {
            header.style.background = 'rgba(255, 255, 255, 0.98)';
            header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.boxShadow = 'none';
        }
        
        // 滚动进度指示器（如果需要）
        this.updateScrollProgress(scrollPercent);
    }

    updateScrollProgress(percent) {
        // 可以在这里添加滚动进度条的逻辑
        if (percent > 25 && !this.hasScrolled25) {
            this.hasScrolled25 = true;
            this.trackUserAction('scroll_milestone', { milestone: '25%' });
        }
        if (percent > 50 && !this.hasScrolled50) {
            this.hasScrolled50 = true;
            this.trackUserAction('scroll_milestone', { milestone: '50%' });
        }
        if (percent > 75 && !this.hasScrolled75) {
            this.hasScrolled75 = true;
            this.trackUserAction('scroll_milestone', { milestone: '75%' });
        }
    }

    handleVisibilityChange() {
        if (document.hidden) {
            this.timeAwayStart = Date.now();
        } else {
            if (this.timeAwayStart) {
                const timeAway = Date.now() - this.timeAwayStart;
                this.trackUserAction('page_return', { timeAway });
            }
        }
    }

    handleExitIntent() {
        if (!this.exitIntentShown) {
            this.exitIntentShown = true;
            // 这里可以显示退出意图弹窗
            this.trackUserAction('exit_intent', { timestamp: Date.now() });
            
            // 示例：显示特别优惠
            if (confirm('等等！在您离开之前，要不要免费试用我们的产品？')) {
                window.open('http://localhost:8000', '_blank');
            }
        }
    }

    handleFormSubmit(e) {
        const form = e.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        this.trackUserAction('form_submit', { 
            form: form.id || form.className,
            data: data 
        });
        
        // 实际项目中这里会处理表单提交
        e.preventDefault();
        alert('表单提交功能将在实际项目中实现');
    }

    handleKeyboardNav(e) {
        // ESC键关闭模态框
        if (e.key === 'Escape') {
            if (this.mobileMenuOpen) {
                this.toggleMobileMenu();
            }
        }
        
        // 空格键或回车键触发按钮
        if (e.key === ' ' || e.key === 'Enter') {
            if (e.target.classList.contains('faq-question')) {
                e.preventDefault();
                this.toggleFAQ(e.target);
            }
        }
    }

    trackUserAction(action, data = {}) {
        const actionData = {
            action,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            ...data
        };
        
        this.userActions.push(actionData);
        
        // 在实际项目中，这里会发送到分析服务
        console.log('User Action:', actionData);
        
        // 模拟发送到Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', action, {
                custom_parameter: JSON.stringify(data)
            });
        }
    }

    trackSectionView(element) {
        const sectionName = element.id || element.className.split(' ')[0];
        this.trackUserAction('section_view', { section: sectionName });
    }

    trackCTA(ctaType) {
        this.trackUserAction('cta_click', { 
            type: ctaType,
            scrollDepth: this.scrollDepth,
            timeOnPage: Date.now() - this.timeOnPage
        });
    }

    // 公共方法
    scrollToSection(sectionId) {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // 性能监控
    reportWebVitals() {
        // 如果有 web-vitals 库
        if (typeof getCLS !== 'undefined') {
            getCLS(this.sendToAnalytics);
            getFID(this.sendToAnalytics);
            getFCP(this.sendToAnalytics);
            getLCP(this.sendToAnalytics);
            getTTFB(this.sendToAnalytics);
        }
    }

    sendToAnalytics({ name, value, id }) {
        // 发送性能数据到分析服务
        console.log('Web Vital:', { name, value, id });
        
        if (typeof gtag !== 'undefined') {
            gtag('event', name, {
                value: Math.round(name === 'CLS' ? value * 1000 : value),
                event_category: 'Web Vitals',
                event_label: id,
                non_interaction: true,
            });
        }
    }

    // 页面卸载时保存数据
    beforeUnload() {
        const sessionData = {
            userActions: this.userActions,
            scrollDepth: this.scrollDepth,
            timeOnPage: Date.now() - this.timeOnPage,
            loadTime: this.loadTime
        };
        
        // 使用 sendBeacon API 发送数据
        if (navigator.sendBeacon) {
            navigator.sendBeacon('/api/analytics', JSON.stringify(sessionData));
        }
    }
}

// A/B测试框架
class ABTest {
    constructor() {
        this.variant = this.getVariant();
        this.applyVariant();
    }

    getVariant() {
        // 简单的A/B测试逻辑
        const saved = localStorage.getItem('ab_variant');
        if (saved) return saved;
        
        const variant = Math.random() < 0.5 ? 'A' : 'B';
        localStorage.setItem('ab_variant', variant);
        return variant;
    }

    applyVariant() {
        if (this.variant === 'B') {
            // 变体B的修改
            const mainCTA = document.querySelector('.cta-main');
            if (mainCTA) {
                mainCTA.textContent = '🔥 立即免费获取';
                mainCTA.style.background = 'linear-gradient(135deg, #FF6B6B, #FF8E53)';
            }
            
            // 跟踪变体
            landingPage.trackUserAction('ab_test_variant', { variant: 'B' });
        }
    }
}

// 转化优化工具
class ConversionOptimizer {
    constructor() {
        this.init();
    }

    init() {
        this.addUrgencyIndicators();
        this.addSocialProof();
        this.addTrustSignals();
        this.optimizeFormFields();
    }

    addUrgencyIndicators() {
        // 添加紧急性指示器
        const pricingSection = document.querySelector('.pricing');
        if (pricingSection) {
            const urgency = document.createElement('div');
            urgency.className = 'urgency-banner';
            urgency.innerHTML = '⏰ 限时优惠：立即注册享受14天免费试用！';
            urgency.style.cssText = `
                background: linear-gradient(45deg, #FF6B6B, #FF8E53);
                color: white;
                text-align: center;
                padding: 1rem;
                font-weight: 600;
                margin-bottom: 2rem;
                border-radius: 8px;
                animation: pulse 2s infinite;
            `;
            pricingSection.insertBefore(urgency, pricingSection.firstChild);
        }
    }

    addSocialProof() {
        // 添加社会证明
        const hero = document.querySelector('.hero-stats');
        if (hero) {
            // 实时用户数据（模拟）
            this.updateLiveStats();
            setInterval(() => this.updateLiveStats(), 5000);
        }
    }

    updateLiveStats() {
        const stats = document.querySelectorAll('.stat-item strong');
        stats.forEach(stat => {
            const currentValue = parseInt(stat.textContent.replace(/,/g, ''));
            const newValue = currentValue + Math.floor(Math.random() * 3);
            stat.textContent = newValue.toLocaleString() + '+';
        });
    }

    addTrustSignals() {
        // 添加信任信号
        const footer = document.querySelector('.footer');
        if (footer) {
            const trustBadges = document.createElement('div');
            trustBadges.className = 'trust-badges';
            trustBadges.innerHTML = `
                <div style="text-align: center; padding: 2rem 0; border-top: 1px solid #374151;">
                    <p style="color: #9CA3AF; margin-bottom: 1rem;">信任与安全</p>
                    <div style="display: flex; justify-content: center; gap: 2rem; flex-wrap: wrap;">
                        <span>🔒 SSL加密</span>
                        <span>🛡️ 隐私保护</span>
                        <span>⭐ 4.8/5.0评分</span>
                        <span>👥 50,000+用户</span>
                    </div>
                </div>
            `;
            footer.appendChild(trustBadges);
        }
    }

    optimizeFormFields() {
        // 优化表单字段（如果有）
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            // 添加实时验证
            const inputs = form.querySelectorAll('input, textarea');
            inputs.forEach(input => {
                input.addEventListener('blur', () => this.validateField(input));
            });
        });
    }

    validateField(field) {
        // 简单的字段验证
        const value = field.value.trim();
        let isValid = true;
        let message = '';

        if (field.type === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            isValid = emailRegex.test(value);
            message = isValid ? '' : '请输入有效的邮箱地址';
        }

        // 显示验证结果
        this.showValidationMessage(field, isValid, message);
    }

    showValidationMessage(field, isValid, message) {
        // 移除现有的验证消息
        const existingMessage = field.parentNode.querySelector('.validation-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // 添加新的验证消息
        if (message) {
            const messageEl = document.createElement('div');
            messageEl.className = 'validation-message';
            messageEl.textContent = message;
            messageEl.style.cssText = `
                color: ${isValid ? '#10B981' : '#EF4444'};
                font-size: 0.875rem;
                margin-top: 0.25rem;
            `;
            field.parentNode.appendChild(messageEl);
        }

        // 更新字段样式
        field.style.borderColor = isValid ? '#10B981' : '#EF4444';
    }
}

// Service Worker 注册
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker registered:', registration);
                
                // 检查更新
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // 有新版本可用
                            if (confirm('网站有新版本可用，是否立即更新？')) {
                                newWorker.postMessage({ type: 'SKIP_WAITING' });
                                window.location.reload();
                            }
                        }
                    });
                });
            })
            .catch(error => {
                console.error('Service Worker registration failed:', error);
            });
    });
}

// 初始化
let landingPage, abTest, conversionOptimizer;

document.addEventListener('DOMContentLoaded', function() {
    landingPage = new LandingPage();
    abTest = new ABTest();
    conversionOptimizer = new ConversionOptimizer();
    
    // 页面卸载前保存数据
    window.addEventListener('beforeunload', () => {
        landingPage.beforeUnload();
    });
    
    // 性能监控
    window.addEventListener('load', () => {
        landingPage.reportWebVitals();
    });
});

// 全局函数（供HTML调用）
function scrollToSection(sectionId) {
    if (landingPage) {
        landingPage.scrollToSection(sectionId);
    }
}

function showBatchContentModal() {
    // 这个函数在HTML中被调用，用于演示集成
    alert('批量内容生成模态框将在这里显示。实际实现中，这将打开一个功能丰富的模态框。');
    landingPage.trackUserAction('modal_open', { type: 'batch_content' });
}

// 错误处理
window.addEventListener('error', function(e) {
    console.error('JavaScript Error:', e);
    
    // 在生产环境中，这里会发送错误报告到监控服务
    if (typeof gtag !== 'undefined') {
        gtag('event', 'exception', {
            description: e.message,
            fatal: false
        });
    }
});

// 导出为全局变量（用于调试）
window.LandingPage = { landingPage, abTest, conversionOptimizer };