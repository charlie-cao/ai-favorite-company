# 🤖 AI-Favorite-Company | 智能浏览助手

> 基于本地AI技术的个人浏览行为分析与内容创作平台

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com/)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-red.svg)](https://developer.chrome.com/docs/extensions/)

## 🎯 项目简介

**智能浏览助手** 是一款革命性的个人生产力工具，通过**100%本地化AI处理**技术，为用户提供隐私保护的浏览行为分析和智能内容创作功能。我们致力于让每一次浏览都变得有价值，让每一个想法都能快速成文。

### ✨ 核心特性

- 🔒 **隐私至上**: 100%本地化数据处理，零隐私风险
- 🧠 **AI驱动**: 基于Ollama本地大模型的智能分析
- 📊 **深度洞察**: 个性化用户画像和行为模式分析
- ✍️ **智能创作**: AI驱动的内容创作助手
- 🌐 **跨平台**: 支持Chrome、Firefox、Safari等主流浏览器
- 🚀 **高性能**: 毫秒级响应，流畅用户体验

## 🏗️ 项目架构

```
ai-favorite-company/
├── chrome_extension/          # Chrome浏览器扩展
│   ├── manifest.json         # 扩展配置文件
│   ├── popup.html            # 扩展弹窗界面
│   ├── popup.js              # 扩展核心逻辑
│   └── icons/                # 扩展图标资源
├── backend/                  # 后端服务
│   ├── server.py             # FastAPI服务器
│   ├── requirements.txt      # Python依赖
│   ├── templates/            # Web界面模板
│   ├── static/               # 静态资源
│   └── docs/                 # 项目文档
├── docs/                     # 用户指南和说明
└── README.md                 # 项目说明
```

## 🚀 快速开始

### 前置要求

- Python 3.8+
- Chrome浏览器
- Ollama (本地AI模型运行环境)

### 1. 安装后端服务

```bash
# 克隆项目
git clone https://github.com/charlie-cao/ai-favorite-company.git
cd ai-favorite-company

# 安装Python依赖
cd backend
pip install -r requirements.txt

# 启动后端服务
python server.py
```

### 2. 安装Chrome扩展

1. 打开Chrome浏览器，访问 `chrome://extensions/`
2. 开启"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择项目中的 `chrome_extension` 文件夹

### 3. 配置AI模型

1. 安装Ollama: [https://ollama.ai](https://ollama.ai)
2. 下载AI模型: `ollama pull gemma3`
3. 访问 `http://localhost:8000/ai` 配置AI服务

## 💻 功能模块

### 🔍 浏览记录分析师

- **智能分析**: 基于AI的浏览行为深度分析
- **用户画像**: 个性化的兴趣和行为模式识别
- **词云生成**: 高频关键词和兴趣标签提取
- **趋势洞察**: 浏览习惯和时间规律发现

### ✍️ 内容创作助手

- **二次创作**: 基于网页内容的AI创作
- **多种风格**: 营销文、评测文、教程文等
- **SEO优化**: 自动关键词优化和标题生成
- **一键导出**: 支持多格式内容导出

### 📊 数据管理平台

- **可视化仪表板**: 直观的数据统计和图表
- **历史记录管理**: 智能分类和搜索功能
- **数据导出**: 支持CSV、JSON等格式
- **隐私控制**: 完全的数据控制权

## 🎨 界面预览

### 主界面
![主界面](docs/images/main-dashboard.png)

### AI助手工作台
![AI助手](docs/images/ai-agents.png)

### 数据分析
![数据分析](docs/images/analytics.png)

## 📚 文档

- [📖 用户使用指南](./docs/)
- [🔧 技术架构文档](./backend/docs/技术架构与产品规划.md)
- [💼 商业计划书](./backend/docs/商业价值与市场分析.md)
- [🎯 产品规划](./backend/docs/项目概述与亮点分析.md)

## 🛠️ 技术栈

### 前端技术
- **Chrome Extension**: Manifest V3
- **Web UI**: HTML5 + Tailwind CSS + Vanilla JS
- **图表库**: Chart.js
- **图标**: Heroicons

### 后端技术
- **Web框架**: FastAPI + Uvicorn
- **数据库**: SQLite
- **AI引擎**: Ollama + 本地大模型
- **数据验证**: Pydantic
- **模板引擎**: Jinja2

### AI技术
- **模型**: Gemma3、Llama2等开源大模型
- **推理**: Ollama本地推理引擎
- **应用**: 自然语言处理、内容生成、数据分析

## 🤝 贡献指南

我们欢迎所有形式的贡献！请阅读我们的贡献指南：

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 开源协议

本项目采用 MIT 协议开源 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🔗 相关链接

- [官方网站](https://smart-browser-assistant.com) (开发中)
- [在线演示](https://demo.smart-browser-assistant.com) (开发中)
- [问题反馈](https://github.com/charlie-cao/ai-favorite-company/issues)
- [讨论区](https://github.com/charlie-cao/ai-favorite-company/discussions)

## 📞 联系我们

- **邮箱**: contact@smart-browser-assistant.com
- **微信**: SmartBrowserAI
- **Twitter**: [@SmartBrowserAI](https://twitter.com/SmartBrowserAI)

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=charlie-cao/ai-favorite-company&type=Date)](https://star-history.com/#charlie-cao/ai-favorite-company&Date)

---

<div align="center">

**让每一次浏览都变得有价值 🚀**

如果这个项目对你有帮助，请考虑给我们一个 ⭐️

</div>