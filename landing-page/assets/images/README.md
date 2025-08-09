# 图片资源目录

此目录包含Landing Page所需的所有图片资源。

## 📸 必需的图片文件

### Logo和图标
- `logo.svg` - 网站Logo (SVG格式，推荐尺寸: 40x40+)
- `favicon.ico` - 网站图标 (16x16, 32x32, 48x48)
- `apple-touch-icon.png` - iOS设备图标 (180x180)

### 社交媒体图片
- `og-image.jpg` - Open Graph图片 (1200x630)
- `twitter-image.jpg` - Twitter Card图片 (1200x600)

### 产品演示
- `demo-preview.jpg` - 演示视频预览图 (16:9比例，推荐1280x720)
- `screenshot-1.png` - 产品截图1 (1280x720)
- `screenshot-2.png` - 产品截图2 (1280x720)

### 用户头像
- `avatar-1.jpg` - 用户头像1 (150x150)
- `avatar-2.jpg` - 用户头像2 (150x150)
- `avatar-3.jpg` - 用户头像3 (150x150)

### PWA图标系列
- `icon-72x72.png`
- `icon-96x96.png`
- `icon-128x128.png`
- `icon-144x144.png`
- `icon-152x152.png`
- `icon-192x192.png`
- `icon-384x384.png`
- `icon-512x512.png`

### 通知图标
- `badge-72x72.png` - 通知徽章图标
- `action-open.png` - 通知操作图标"打开"
- `action-close.png` - 通知操作图标"关闭"

## 🎨 图片规范

### 格式建议
- **Logo**: SVG (矢量，可缩放)
- **照片**: WebP优先，JPEG备选
- **图标**: PNG (支持透明)
- **插图**: SVG或PNG

### 质量标准
- **分辨率**: 高DPI屏幕支持 (2x/3x)
- **压缩**: 保持文件大小最小化
- **优化**: 使用工具如ImageOptim、TinyPNG等

### 命名规范
- 使用小写字母和连字符
- 包含尺寸信息 (如: icon-192x192.png)
- 语义化命名 (如: hero-background.jpg)

## 🛠 图片生成工具

### 在线工具
- [Canva](https://canva.com) - 设计工具
- [Figma](https://figma.com) - UI设计
- [Remove.bg](https://remove.bg) - 背景移除
- [TinyPNG](https://tinypng.com) - 图片压缩

### 本地工具
- Photoshop
- GIMP (免费)
- Sketch (Mac)
- Affinity Designer

## 📏 推荐尺寸

### 社交媒体
- **Facebook/LinkedIn**: 1200x630
- **Twitter**: 1200x600
- **Instagram**: 1080x1080

### 移动应用图标
- **iOS**: 180x180 (最小要求)
- **Android**: 192x192 (推荐)
- **PWA**: 512x512 (最大)

### 网页使用
- **Hero背景**: 1920x1080 (全屏)
- **产品截图**: 1280x720 (16:9)
- **用户头像**: 150x150 (圆形裁剪)

## 🔄 图片占位符

在开发阶段，可以使用以下占位符服务:

```html
<!-- Logo占位符 -->
<img src="https://via.placeholder.com/40x40/4F46E5/FFFFFF?text=LOGO" alt="Logo">

<!-- 用户头像占位符 -->
<img src="https://via.placeholder.com/150x150/E5E7EB/6B7280?text=User" alt="用户头像">

<!-- 产品截图占位符 -->
<img src="https://via.placeholder.com/1280x720/F3F4F6/374151?text=Screenshot" alt="产品截图">
```

## ⚡ 性能优化

### 懒加载
```html
<img src="placeholder.jpg" data-src="actual-image.jpg" loading="lazy" alt="描述">
```

### 响应式图片
```html
<picture>
  <source srcset="image.webp" type="image/webp">
  <source srcset="image.jpg" type="image/jpeg">
  <img src="image.jpg" alt="描述">
</picture>
```

### 预加载关键图片
```html
<link rel="preload" as="image" href="hero-image.jpg">
```

---

💡 **提示**: 在生产环境部署前，请确保所有图片都已优化并放置在正确的位置。