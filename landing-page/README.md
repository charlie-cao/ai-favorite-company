# FavAI Landing Page

这是FavAI产品的高转化率Landing Page，专为SEO优化和用户转化而设计。

## 🚀 特性

### SEO优化
- ✅ 完整的Meta标签优化
- ✅ 结构化数据(JSON-LD)
- ✅ 语义化HTML5结构
- ✅ Open Graph和Twitter Cards
- ✅ 网站地图(sitemap.xml)
- ✅ robots.txt配置
- ✅ 页面性能优化

### 性能优化
- ✅ 响应式设计(移动端优先)
- ✅ 图片懒加载
- ✅ CSS/JS压缩和缓存
- ✅ Service Worker离线支持
- ✅ PWA功能
- ✅ Web Vitals监控

### 转化优化
- ✅ A/B测试框架
- ✅ 用户行为跟踪
- ✅ 转化漏斗分析
- ✅ 退出意图检测
- ✅ 社会证明元素
- ✅ 紧急性指示器

### 用户体验
- ✅ 平滑滚动动画
- ✅ 交互式演示
- ✅ 手风琴FAQ
- ✅ 移动端优化
- ✅ 键盘导航支持
- ✅ 无障碍访问(A11y)

## 📁 文件结构

```
landing-page/
├── index.html              # 主页面
├── manifest.json           # PWA配置
├── robots.txt             # 搜索引擎爬虫规则
├── sitemap.xml            # 网站地图
├── sw.js                  # Service Worker
├── .htaccess              # Apache配置(可选)
├── assets/
│   ├── css/
│   │   └── main.css       # 主样式文件
│   ├── js/
│   │   └── main.js        # 主脚本文件
│   └── images/            # 图片资源目录
└── README.md              # 说明文档
```

## 🛠 部署说明

### 1. 环境要求
- Web服务器(Apache/Nginx/Caddy等)
- HTTPS支持(推荐)
- Gzip压缩支持

### 2. 配置步骤

#### Apache服务器
1. 确保mod_rewrite、mod_deflate、mod_expires、mod_headers模块已启用
2. 将`.htaccess`文件放在网站根目录
3. 配置SSL证书(推荐使用Let's Encrypt)

#### Nginx服务器
创建nginx配置文件:

```nginx
server {
    listen 443 ssl http2;
    server_name favai.io www.favai.io;
    
    root /path/to/landing-page;
    index index.html;
    
    # SSL配置
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Gzip压缩
    gzip on;
    gzip_types text/css application/javascript image/svg+xml;
    
    # 缓存配置
    location ~* \.(jpg|jpeg|png|gif|svg|webp|ico)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location ~* \.(css|js)$ {
        expires 1M;
        add_header Cache-Control "public";
    }
    
    # 安全头
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
}
```

### 3. SEO配置

#### Google Analytics
1. 在`index.html`中替换`GA_MEASUREMENT_ID`为您的实际ID
2. 配置目标转化跟踪

#### Google Search Console
1. 验证网站所有权
2. 提交sitemap.xml
3. 监控爬虫错误和性能

#### 图片优化
在`assets/images/`目录中放置以下文件:
- `logo.svg` - 网站Logo
- `favicon.ico` - 网站图标
- `og-image.jpg` (1200x630) - Open Graph图片
- `twitter-image.jpg` (1200x600) - Twitter Card图片
- `demo-preview.jpg` - 演示视频预览图
- `avatar-1.jpg`, `avatar-2.jpg`, `avatar-3.jpg` - 用户头像
- PWA图标系列(72x72到512x512像素)

## 📊 监控和分析

### 性能监控
页面已集成Web Vitals监控，数据会发送到Google Analytics:
- LCP (Largest Contentful Paint)
- FID (First Input Delay)
- CLS (Cumulative Layout Shift)
- FCP (First Contentful Paint)
- TTFB (Time to First Byte)

### 用户行为跟踪
自动跟踪以下用户行为:
- 页面滚动深度
- CTA按钮点击
- 表单提交
- FAQ展开
- 演示步骤切换
- 退出意图检测

### A/B测试
页面包含基础的A/B测试框架:
- 变体A: 原始版本
- 变体B: 优化的CTA文案和颜色

## 🔧 自定义配置

### 修改内容
1. 编辑`index.html`中的文案和链接
2. 更新`assets/css/main.css`中的品牌颜色
3. 在`assets/js/main.js`中调整跟踪事件

### SEO元数据
在`index.html`的`<head>`部分更新:
- `title`标签
- `meta description`
- `meta keywords`
- Open Graph数据
- 结构化数据(JSON-LD)

### 品牌定制
在CSS变量中修改品牌色彩:
```css
:root {
    --primary-color: #4F46E5;    /* 主色调 */
    --secondary-color: #06B6D4;  /* 辅助色 */
    --accent-color: #F59E0B;     /* 强调色 */
}
```

## 📈 性能优化建议

1. **图片优化**
   - 使用WebP格式
   - 实现响应式图片
   - 添加懒加载

2. **代码分割**
   - 将CSS拆分为关键和非关键部分
   - 使用动态导入加载非关键JS

3. **CDN配置**
   - 使用CDN加速静态资源
   - 配置合适的缓存策略

4. **数据库优化**
   - 缓存API响应
   - 使用连接池
   - 优化查询性能

## 🐛 故障排除

### 常见问题

**Q: Service Worker无法注册**
A: 确保页面通过HTTPS访问，localhost除外

**Q: 样式不生效**
A: 检查CSS文件路径和浏览器缓存

**Q: 分析数据不准确**
A: 验证Google Analytics配置和跟踪代码

**Q: 移动端显示异常**
A: 检查viewport meta标签和响应式CSS

### 调试工具
- Chrome DevTools
- Lighthouse性能审计
- Google PageSpeed Insights
- GTmetrix性能分析

## 📞 技术支持

如有技术问题，请联系开发团队或查看以下资源:
- 项目GitHub仓库
- 技术文档
- 社区论坛

---

© 2024 FavAI Team. 保留所有权利。