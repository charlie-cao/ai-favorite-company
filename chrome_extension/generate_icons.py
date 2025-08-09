#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Chrome插件图标生成器
根据输入的单词或文本自动生成不同尺寸的图标文件
"""

import os
import sys
from PIL import Image, ImageDraw, ImageFont
import argparse

def create_icon(text, size, output_path, bg_color=(70, 126, 234), text_color=(255, 255, 255)):
    """
    创建图标
    :param text: 要显示的文本
    :param size: 图标尺寸 (width, height)
    :param output_path: 输出文件路径
    :param bg_color: 背景颜色 (R, G, B)
    :param text_color: 文字颜色 (R, G, B)
    """
    # 创建图像
    image = Image.new('RGBA', size, bg_color + (255,))
    draw = ImageDraw.Draw(image)
    
    # 计算字体大小（根据图标尺寸自适应）
    font_size = min(size) // 2
    
    # 尝试使用系统字体
    try:
        # Windows
        font_paths = [
            "C:/Windows/Fonts/msyh.ttc",  # 微软雅黑
            "C:/Windows/Fonts/simsun.ttc",  # 宋体
            "C:/Windows/Fonts/arial.ttf",  # Arial
            # macOS
            "/System/Library/Fonts/PingFang.ttc",
            "/System/Library/Fonts/Helvetica.ttc",
            # Linux
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
        ]
        
        font = None
        for font_path in font_paths:
            if os.path.exists(font_path):
                try:
                    font = ImageFont.truetype(font_path, font_size)
                    break
                except:
                    continue
        
        if font is None:
            font = ImageFont.load_default()
            
    except Exception as e:
        print(f"字体加载警告: {e}")
        font = ImageFont.load_default()
    
    # 获取文本边界框
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    # 计算文本位置（居中）
    x = (size[0] - text_width) // 2
    y = (size[1] - text_height) // 2
    
    # 绘制文本
    draw.text((x, y), text, fill=text_color, font=font)
    
    # 保存图像
    image.save(output_path, 'PNG')
    print(f"✅ 已生成: {output_path} ({size[0]}x{size[1]})")

def generate_chrome_icons(text, output_dir=".", theme="blue"):
    """
    生成Chrome插件所需的所有尺寸图标
    :param text: 显示的文本
    :param output_dir: 输出目录
    :param theme: 主题色彩
    """
    # 定义主题颜色
    themes = {
        "blue": (70, 126, 234),      # 蓝色主题
        "green": (40, 167, 69),      # 绿色主题
        "purple": (102, 75, 162),    # 紫色主题
        "orange": (255, 140, 0),     # 橙色主题
        "red": (220, 53, 69),        # 红色主题
        "dark": (52, 58, 64),        # 深色主题
        "gradient": (102, 126, 234)   # 渐变主题（简化为单色）
    }
    
    bg_color = themes.get(theme, themes["blue"])
    text_color = (255, 255, 255)  # 白色文字
    
    # Chrome插件所需的图标尺寸
    sizes = [
        (16, 16, "icon16.png"),
        (32, 32, "icon32.png"),
        (48, 48, "icon48.png"),
        (128, 128, "icon128.png")
    ]
    
    # 确保输出目录存在
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"🎨 开始生成图标...")
    print(f"📝 文本: {text}")
    print(f"🎯 主题: {theme}")
    print(f"📁 输出目录: {output_dir}")
    print("-" * 50)
    
    # 生成所有尺寸的图标
    for width, height, filename in sizes:
        output_path = os.path.join(output_dir, filename)
        create_icon(text, (width, height), output_path, bg_color, text_color)
    
    print("-" * 50)
    print("🎉 所有图标生成完成！")
    return True

def create_advanced_icon(text, size, output_path, style="modern"):
    """
    创建高级样式图标
    :param text: 文本
    :param size: 尺寸
    :param output_path: 输出路径
    :param style: 样式类型
    """
    image = Image.new('RGBA', size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    
    if style == "modern":
        # 现代风格：圆角矩形背景
        margin = size[0] // 8
        draw.rounded_rectangle(
            [margin, margin, size[0] - margin, size[1] - margin],
            radius=size[0] // 4,
            fill=(70, 126, 234, 255),
            outline=(255, 255, 255, 100),
            width=2
        )
    elif style == "circle":
        # 圆形背景
        margin = size[0] // 16
        draw.ellipse(
            [margin, margin, size[0] - margin, size[1] - margin],
            fill=(70, 126, 234, 255),
            outline=(255, 255, 255, 50),
            width=1
        )
    elif style == "flat":
        # 扁平化设计
        draw.rectangle([0, 0, size[0], size[1]], fill=(70, 126, 234, 255))
    
    # 添加文本
    font_size = min(size) // 3
    try:
        font_paths = [
            "C:/Windows/Fonts/msyh.ttc",
            "C:/Windows/Fonts/arial.ttf",
            "/System/Library/Fonts/PingFang.ttc",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
        ]
        
        font = None
        for font_path in font_paths:
            if os.path.exists(font_path):
                try:
                    font = ImageFont.truetype(font_path, font_size)
                    break
                except:
                    continue
        
        if font is None:
            font = ImageFont.load_default()
    except:
        font = ImageFont.load_default()
    
    # 居中绘制文本
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    x = (size[0] - text_width) // 2
    y = (size[1] - text_height) // 2
    
    draw.text((x, y), text, fill=(255, 255, 255, 255), font=font)
    
    image.save(output_path, 'PNG')
    print(f"✅ 已生成: {output_path} ({style}样式)")

def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='Chrome插件图标生成器')
    parser.add_argument('text', nargs='?', help='要显示的文本')
    parser.add_argument('-o', '--output', default='.', help='输出目录 (默认: 当前目录)')
    parser.add_argument('-t', '--theme', default='blue', 
                       choices=['blue', 'green', 'purple', 'orange', 'red', 'dark'],
                       help='主题颜色 (默认: blue)')
    parser.add_argument('-s', '--style', default='modern',
                       choices=['modern', 'circle', 'flat'],
                       help='图标样式 (默认: modern)')
    parser.add_argument('--advanced', action='store_true', help='使用高级样式')
    
    args = parser.parse_args()
    
    # 如果没有提供文本参数，交互式输入
    if not args.text:
        print("🎨 Chrome插件图标生成器")
        print("=" * 50)
        text = input("请输入要显示的文字 (1-2个字符效果最佳): ").strip()
        if not text:
            print("❌ 文本不能为空！")
            return
        
        print("\n可选主题:")
        themes = ["blue", "green", "purple", "orange", "red", "dark"]
        for i, theme in enumerate(themes, 1):
            print(f"{i}. {theme}")
        
        try:
            theme_choice = input(f"\n选择主题 (1-{len(themes)}, 默认: blue): ").strip()
            if theme_choice.isdigit() and 1 <= int(theme_choice) <= len(themes):
                args.theme = themes[int(theme_choice) - 1]
        except:
            pass
        
        args.text = text
    
    # 检查PIL是否可用
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        print("❌ 错误: 需要安装 Pillow 库")
        print("请运行: pip install Pillow")
        return
    
    try:
        if args.advanced:
            # 生成高级样式图标
            sizes = [(16, 16, "icon16.png"), (32, 32, "icon32.png"), 
                    (48, 48, "icon48.png"), (128, 128, "icon128.png")]
            
            os.makedirs(args.output, exist_ok=True)
            print(f"🎨 生成高级样式图标: {args.text}")
            print("-" * 50)
            
            for width, height, filename in sizes:
                output_path = os.path.join(args.output, filename)
                create_advanced_icon(args.text, (width, height), output_path, args.style)
        else:
            # 生成标准图标
            generate_chrome_icons(args.text, args.output, args.theme)
        
        print(f"\n📁 图标已保存到: {os.path.abspath(args.output)}")
        print("💡 现在可以重新加载Chrome插件了！")
        
    except Exception as e:
        print(f"❌ 生成图标时出错: {e}")
        return

if __name__ == "__main__":
    main()