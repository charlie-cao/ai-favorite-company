# 🤖 AI简化配置说明

## 🚀 快速开始

### 1. 启动Ollama服务

在命令行中运行：
```bash
ollama serve
```

确保你已经下载了模型：
```bash
ollama pull qwen3
ollama pull gemma3
ollama pull deepseek-r1
```

### 2. 启动Web服务

**方法1：双击启动**
```
双击: backend\启动AI服务.bat
```

**方法2：命令行启动**
```bash
cd backend
python server.py
```

### 3. 配置AI

访问简化配置页面：
```
http://localhost:8000/ai
```

## 📋 简化配置步骤

### 步骤1: 检测Ollama
- 点击 **"检测Ollama"** 按钮
- 系统会自动检测 http://localhost:11434
- 显示可用模型列表

### 步骤2: 选择模型
- 从列表中点击选择一个模型
- 推荐模型：
  - `qwen3:latest` - 中文友好
  - `gemma3:latest` - 速度较快
  - `deepseek-r1:latest` - 推理能力强

### 步骤3: 测试模型
- 输入测试消息，如："你好"
- 点击 **"测试"** 按钮
- 查看AI响应效果

### 步骤4: 保存配置
- 确认模型工作正常后
- 点击 **"保存配置"** 按钮
- 配置自动生效

## ✅ 配置完成

配置成功后，你会看到绿色的 **"AI配置已激活"** 状态提示。

现在可以：
- 在历史记录管理中使用AI分析功能
- 通过API接口调用AI服务
- 创建和使用Agent模板

## 🛠️ 故障排除

### 问题1: "连接失败"
**解决方案：**
1. 确认Ollama服务已启动：`ollama serve`
2. 检查端口11434是否被占用
3. 重启Ollama服务

### 问题2: "没有可用模型"
**解决方案：**
1. 下载模型：`ollama pull qwen3`
2. 查看已有模型：`ollama list`
3. 确认模型下载完成

### 问题3: "模型测试失败"
**解决方案：**
1. 确认选择的模型存在
2. 尝试手动测试：`ollama run qwen3`
3. 检查网络连接和系统资源

### 问题4: 模型响应慢
**解决方案：**
1. 选择较小的模型（如gemma3）
2. 确保有足够的内存（8GB+推荐）
3. 关闭其他占用资源的程序

## 📊 当前支持的模型

根据你的系统显示，可用模型：
- ✅ `qwen3:latest` (5.2 GB)
- ✅ `deepseek-r1:latest` (5.2 GB)  
- ✅ `nomic-embed-text:latest` (274 MB)
- ✅ `gemma3:latest` (3.3 GB)

## 🔄 重新配置

如需更换模型或重新配置：
1. 在AI配置页面点击 **"重新配置"**
2. 重复配置步骤
3. 新配置会替换旧配置

## 🎯 下一步

配置完成后，你可以：

1. **体验AI功能**：
   - 访问 http://localhost:8000
   - 在历史记录中使用AI分析

2. **高级配置**：
   - 访问 http://localhost:8000/ai-advanced
   - 创建Agent模板和复杂配置

3. **API集成**：
   - 查看API文档：http://localhost:8000/docs
   - 集成到其他应用中

---

**享受AI增强的浏览历史管理体验！** 🚀