# Chrome插件图标生成器

这个Python脚本可以根据输入的文字自动生成Chrome插件所需的所有尺寸图标文件。

## 安装依赖

```bash
pip install Pillow
```

## 使用方法

### 方法1: 交互式使用（推荐新手）

```bash
python generate_icons.py
```

然后按提示输入：
- 要显示的文字（1-2个字符效果最佳）
- 选择主题颜色

### 方法2: 命令行参数

```bash
# 基本用法
python generate_icons.py "H"

# 指定主题和输出目录
python generate_icons.py "历史" --theme green --output ./icons

# 使用高级样式
python generate_icons.py "H" --advanced --style circle
```

## 参数说明

- `text`: 要显示的文字
- `-o, --output`: 输出目录（默认当前目录）
- `-t, --theme`: 主题颜色
  - `blue`: 蓝色（默认）
  - `green`: 绿色
  - `purple`: 紫色
  - `orange`: 橙色
  - `red`: 红色
  - `dark`: 深色
- `-s, --style`: 图标样式（配合--advanced使用）
  - `modern`: 现代圆角矩形（默认）
  - `circle`: 圆形
  - `flat`: 扁平化
- `--advanced`: 启用高级样式

## 生成的文件

脚本会生成Chrome插件所需的4个图标文件：
- `icon16.png` (16x16像素)
- `icon32.png` (32x32像素)
- `icon48.png` (48x48像素)
- `icon128.png` (128x128像素)

## 使用示例

### 示例1: 为历史记录插件生成图标
```bash
python generate_icons.py "历" --theme blue
```

### 示例2: 生成英文字母图标
```bash
python generate_icons.py "H" --theme purple --advanced --style circle
```

### 示例3: 批量生成到指定目录
```bash
python generate_icons.py "📜" --output ./chrome_extension_icons --theme green
```

## 推荐文字选择

- **单个汉字**: "历", "史", "记"
- **英文字母**: "H", "HV", "HR"
- **符号**: "📜", "⏰", "📖"
- **数字**: "1", "2"

## 注意事项

1. 文字建议1-2个字符，太长会显示不全
2. 脚本会自动适配系统字体
3. 生成后直接替换Chrome插件目录中的图标文件
4. 重新加载插件即可看到新图标

## 故障排除

### 问题1: 提示缺少Pillow
```bash
pip install Pillow
```

### 问题2: 字体显示异常
脚本会自动尝试多种系统字体，如果都不可用会使用默认字体。

### 问题3: 权限错误
确保对输出目录有写入权限。

## 快速开始

1. 打开命令行，切换到插件目录：
```bash
cd C:\Users\charlie\Desktop\google_fav
```

2. 运行脚本：
```bash
python generate_icons.py
```

3. 输入文字，比如"历"

4. 选择主题，比如选择1（蓝色）

5. 重新加载Chrome插件