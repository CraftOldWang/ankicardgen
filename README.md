# Anki卡片生成器

一个用于从日语文本中提取句子，并使用AI生成Anki卡片的桌面应用程序。

## 功能特点

- 从Markdown文件中提取日语句子
- 使用Google Gemini AI生成Anki卡片
- 编辑和自定义生成的卡片
- 将卡片保存为Markdown格式，方便导入Anki
- 跟踪已处理的句子，避免重复工作

## 技术栈

- Electron: 跨平台桌面应用框架
- React: 用户界面库
- TypeScript: 类型安全的JavaScript超集
- Tailwind CSS: 实用优先的CSS框架
- Vite: 现代前端构建工具
- Google Generative AI SDK: 用于调用Gemini API

## 开发指南

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建应用

```bash
npm run build
```

## 使用方法

1. 启动应用程序
2. 点击"选择文件"按钮，选择包含日语文本的Markdown文件
3. 从左侧句子列表中选择一个句子
4. 点击"生成卡片"按钮，使用AI生成Anki卡片
5. 根据需要编辑生成的卡片
6. 点击"保存卡片"按钮，将卡片保存到文件中

## 注意事项

- 使用前需要设置Gemini API密钥
- 建议将日语文本按段落分隔，每个段落之间留一个空行
- 生成的卡片将保存为与原文件同名但后缀为`_cards.md`的文件

## 许可证

MIT