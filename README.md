# mooc-manus-web

智能体编排管理平台前端应用 - 基于 React + TypeScript + Vite + Ant Design 构建。

## 项目定位

可视化智能体编排管理平台,提供以下核心功能:

- **模型配置管理**: 配置 LLM 模型参数(BaseURL、API Key、温度等)
- **工具包管理**: 管理工具供应商和工具函数
- **Skill 管理**: 管理 Skill 及其多版本,支持 Git/ZIP 导入
- **智能体对话**: 可视化能力装配 + SSE 流式多轮对话

## 技术栈

- React 18 + TypeScript 5
- Vite 5(开发服务器和构建工具)
- Ant Design 5(UI 组件库)
- tailwindcss(原子化 CSS)
- Zustand(状态管理)
- React Router v6(路由)
- Axios(HTTP 客户端)
- EventSource(SSE 事件流)

## 环境要求

- Node.js >= 18
- npm >= 9
- 后端服务: mooc-manus(默认 http://localhost:8080)

## 快速开始

### 1. 安装依赖

```bash
npm install --legacy-peer-deps
```

### 2. 配置环境变量

复制 `.env.development` 并按需修改:

```bash
VITE_API_BASE_URL=http://localhost:8080
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 4. 构建生产版本

```bash
npm run build
```

构建产物输出到 `dist/` 目录。

### 5. 预览生产构建

```bash
npm run preview
```

## 目录结构

```
src/
├── api/              # API 接口层
│   ├── request.ts    # Axios 实例配置
│   ├── sse.ts        # SSE 客户端封装
│   └── modules/      # 按业务模块拆分的 API
├── components/       # 公共组件
│   └── Layout/       # 全局布局
├── pages/            # 页面组件
│   ├── Agent/        # 智能体对话
│   ├── AppConfig/    # 模型配置
│   ├── Tool/         # 工具管理
│   └── Skill/        # Skill 管理
├── store/            # Zustand 状态管理
├── types/            # TypeScript 类型定义
├── utils/            # 工具函数
├── hooks/            # 自定义 Hooks
├── constants/        # 常量
├── router/           # 路由配置
└── main.tsx          # 应用入口
```

## 关键模块说明

### SSE 流式对话

- 文件: `src/api/sse.ts`
- 特点:
  - 1 分钟超时自动断开
  - JSON 解析容错
  - 重复订阅防护
  - 支持后端定制化事件类型(message/tool_call_*/done 等 11 种)

### 全局请求封装

- 文件: `src/api/request.ts`
- 特点:
  - 统一错误处理(根据 HTTP 状态码映射提示)
  - 透传后端响应数据(无统一封装)
  - 支持环境变量配置 BaseURL

## 开发规范

- 代码风格: ESLint + Prettier
- Commit Message: 中文,遵循 conventional commits 规范

```bash
# 格式化代码
npm run format

# Lint 检查
npm run lint
```

## 联调说明

### 开发环境

前端默认通过 Vite 代理调用后端:

```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true,
    },
  },
},
```

### SSE 调试

对话接口使用 SSE,需要确保:
- 后端正确返回 `Content-Type: text/event-stream`
- 事件格式: `event: <name>\ndata: <json>\n\n`
- 浏览器不会通过 fetch 自动消费 SSE,必须使用 EventSource

## 注意事项

**antd 6.x 与 React 19**

由于 antd 6.x 的部分组件 peer dependency 声明了 React 18,安装时需要 `--legacy-peer-deps`:

```bash
npm install --legacy-peer-deps
```

**SSE 不支持自动重连**

按设计要求,SSE 连接断开后不会自动重连,会提示用户"连接中断"。用户需要重新发起对话。

## 相关项目

- [mooc-manus](https://github.com/pw151294/mooc-manus.git) - 后端服务(Go)
- mooc-manus-all - 总仓库(包含前后端 Git Submodule)
