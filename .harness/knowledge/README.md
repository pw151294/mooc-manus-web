# Knowledge - 前端（mooc-manus-web）

> 本目录承载 **mooc-manus-web 前端** 的"知识地图"。与 `rules/` 的边界一致：
> - `rules/` 回答"必须 / 禁止做什么"（强约束，可静态校验）
> - `knowledge/` 回答"现状是怎样的、为什么这么做"（叙述性，配合代码与图理解形态）
>
> 内容**按真实代码描述**——不按 plan 的"理想态"写。任何与 plan 的偏离都在对应文档 §现状基线 注明。

补充父仓 knowledge：跨仓事件协议 / 部署 / 子模块工作流详见
`mooc-manus-all/.harness/knowledge/`（特别是
[`event-protocol.md`](../../../.harness/knowledge/event-protocol.md)
是 16 种 SSE 事件的唯一权威定义）。

## 索引

| 主题 | 文件 | 关联 rules / 跨仓 |
|------|------|------------------|
| SSEClient 架构（fetch + ReadableStream + AbortController + 60s 超时） | [sse-client-architecture.md](./sse-client-architecture.md) | R-41-sse, R-42-ts, R-20-contracts |
| 对话 UI 事件流（SSEClient → Zustand → 渲染） | [chat-ui-event-flow.md](./chat-ui-event-flow.md) | R-40-react, R-41-sse, R-45-event |
| 组件分层（页面 / 容器 / 展示三类） | [component-taxonomy.md](./component-taxonomy.md) | R-40-react, R-43-a11y |
| Zustand 状态管理（4 个业务 store 实际写法） | [state-management.md](./state-management.md) | R-40-react, R-42-ts |

## 阅读顺序

新成员推荐路径：

1. **先看父仓 [`event-protocol.md`](../../../.harness/knowledge/event-protocol.md)** —— 后端发的 16 种事件、payload、顺序约束（前端目前只覆盖其中 11 种，详见 R-41-sse §现状基线）。
2. **[sse-client-architecture.md](./sse-client-architecture.md)** —— `SSEClient` 类如何把 `fetch` 流解成事件回调；订阅、超时、关闭、错误的状态机。
3. **[chat-ui-event-flow.md](./chat-ui-event-flow.md)** —— 一次"用户发消息 → 接 SSE → 更新 UI"端到端走了哪些层。
4. **[state-management.md](./state-management.md)** —— Zustand 4 个 store（agent / skill / tool / appConfig）的边界与组合方式，理解为什么不用 Context。
5. **[component-taxonomy.md](./component-taxonomy.md)** —— `pages/<Feature>/{index.tsx, SubComponent.tsx}` + `components/Layout/` 形态收尾。

## 与 rules 的协同

knowledge 不重复 rules 正文，只补充"为什么"。前端 rules 短码（R-40 ~ R-43）落库于
`mooc-manus-web/.harness/rules/`：

- **R-40-react** —— React 编码规范（目录结构、组件划分、Zustand 边界）
- **R-41-sse** —— SSE 事件处理（SSEClient 复用、生命周期、不自动重连）
- **R-42-ts** —— TypeScript 严格度（禁 any、DTO 对齐、渐进迁移）
- **R-43-a11y** —— UI 可访问性（antd 优先、ARIA 与键盘）

跨仓 rule（总仓 `mooc-manus-all/.harness/rules/`）与本目录交叉处：

- **R-20-contracts** —— 前后端契约：`src/types/sse.ts` 与 `events/constants.go` 必须一致
- **R-31-untrusted** —— 外部内容（skill 模板、MCP 工具描述）的展示侧需做转义/折叠
- **R-32-secrets** —— LLM API key 等敏感字段不得透传到前端

后端协同 knowledge（`mooc-manus/.harness/knowledge/`）：

- **event-driven-model.md** —— 后端事件发布的源头视角（Agent → SSE channel）
- **agent-internals.md** —— 4 种 Agent 决定了前端事件的分布形态（PlanAgent 才有 `step_*` / `plan_*`）

## 维护

- **不写 plan 理想态**：4 份主文档的 §现状基线 都对照 plan 标注实际偏差（如未引入 zod、`src/hooks/` 仍空、ESLint 自定义规则未落地）。
- 实质重构（新增事件类型、新增 store、引入 zod、调整目录结构）必须同步更新对应 knowledge 文件，并视情况落 ADR 到父仓 `mooc-manus-all/.harness/retro/decisions/`。
- 行数原则：每份 50-150 行；超出需说明（plan §3）。
- 校验：`HARNESS_ROOT=mooc-manus-web/.harness bash .harness/scripts/validate-harness.sh` 抽样检查文件存在与基本结构。
