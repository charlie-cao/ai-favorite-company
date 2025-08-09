# 贡献指南

感谢您对 AI-Favorite-Company 项目的关注！我们欢迎各种形式的贡献。

## 🤝 如何贡献

### 报告Bug

如果您发现了bug，请通过以下方式报告：

1. 在 [Issues](https://github.com/charlie-cao/ai-favorite-company/issues) 页面创建新issue
2. 使用"Bug Report"模板
3. 提供详细的复现步骤和环境信息

### 功能请求

如果您有新功能的想法：

1. 在 [Issues](https://github.com/charlie-cao/ai-favorite-company/issues) 页面创建新issue
2. 使用"Feature Request"模板
3. 详细描述功能需求和使用场景

### 代码贡献

1. **Fork 项目**
   ```bash
   git clone https://github.com/your-username/ai-favorite-company.git
   ```

2. **创建功能分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **进行开发**
   - 遵循代码规范
   - 添加必要的测试
   - 更新相关文档

4. **提交更改**
   ```bash
   git commit -m "feat: add your feature description"
   ```

5. **推送分支**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **创建 Pull Request**
   - 使用清晰的标题和描述
   - 关联相关的issues
   - 等待代码审查

## 📝 代码规范

### Python 代码
- 遵循 PEP 8 规范
- 使用类型注解
- 添加必要的文档字符串
- 保持函数简洁，单一职责

### JavaScript 代码
- 使用 ES6+ 语法
- 保持代码简洁和可读性
- 添加必要的注释
- 遵循项目的命名约定

### 提交信息
使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

- `feat:` 新功能
- `fix:` Bug修复
- `docs:` 文档更新
- `style:` 代码格式化
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 其他杂项

## 🧪 测试

在提交代码前，请确保：

1. 所有现有测试通过
2. 新功能包含相应测试
3. 代码覆盖率不下降

```bash
# 运行测试
cd backend
python -m pytest

# 运行代码检查
flake8 .
black --check .
```

## 📚 文档

如果您的贡献涉及用户可见的更改，请：

1. 更新相关的README文档
2. 添加或更新API文档
3. 更新用户指南

## 🎯 开发环境设置

1. **安装依赖**
   ```bash
   cd backend
   pip install -r requirements.txt
   pip install -r requirements-dev.txt  # 开发依赖
   ```

2. **安装Ollama**
   ```bash
   # 访问 https://ollama.ai 下载安装
   ollama pull gemma3
   ```

3. **启动开发服务器**
   ```bash
   python server.py
   ```

4. **加载Chrome扩展**
   - 打开 `chrome://extensions/`
   - 开启开发者模式
   - 加载 `chrome_extension` 目录

## 🔍 代码审查

我们的代码审查关注：

- **功能性**: 代码是否按预期工作
- **性能**: 是否有性能问题
- **安全性**: 是否存在安全隐患
- **可维护性**: 代码是否易于理解和维护
- **测试**: 是否有充分的测试覆盖

## 📞 获取帮助

如果您在贡献过程中遇到问题：

1. 查看 [文档](./docs/)
2. 在 [Discussions](https://github.com/charlie-cao/ai-favorite-company/discussions) 提问
3. 加入我们的微信群：SmartBrowserAI

## 🏆 贡献者

感谢所有贡献者的努力！

<!-- 这里会自动生成贡献者列表 -->

---

再次感谢您的贡献！每一个贡献都让这个项目变得更好。