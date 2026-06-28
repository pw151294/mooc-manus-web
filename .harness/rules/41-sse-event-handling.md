---
rule_id: R-41-sse
severity: high
---

# SSE 事件处理

mooc-manus-web 通过 `src/api/sse.ts` 内的 `SSEClient` 类与后端建立 SSE 流（基于 `fetch` + `ReadableStream` + `AbortController`，而非浏览器原生 `EventSource`，以支持 POST + 自定义 header）。本规则锁定 SSE 订阅入口、事件类型与生命周期管理，与总仓 R-20-contracts（前后端契约，详见 `mooc-manus-all/.harness/rules/20-cross-repo-contracts.md`）协同。

## 禁止行为

1. **禁止直接 `new EventSource(...)`**
   - 浏览器原生 `EventSource` 不支持 POST 与自定义 header，与后端 chat 接口（POST + body）不兼容
   - 必须通过 `import SSEClient from '@/api/sse'` 复用既有客户端
   - 当前代码库未出现 `new EventSource`；新增代码不得引入
   - ESLint 自定义规则 `no-direct-event-source`（plan 要点）当前未实现；新增前请先开 ADR 评估对 `eslint.config.js` 的影响，过渡期靠 PR review + 上述 `grep` 静态检查兜底。

2. **禁止在 `src/api/sse.ts` 之外手写 SSE 帧解析**
   - 帧分隔（`\n\n` / `\r\n\r\n`）、`event:` / `data:` 字段抽取、JSON.parse 全部由 `SSEClient.dispatchFrame` 处理
   - 业务侧只关心 `onEvent(type, data)` 回调，不得自己 `fetch` 后再 split 文本流

3. **禁止订阅未在 `src/types/sse.ts` 声明的 `SSEEventType`**
   - 当前已声明 11 种：`message` / `message_end` / `tool_call_start` / `tool_call_complete` / `tool_call_fail` / `error` / `done` / `title` / `plan_create_success` / `step_start` / `step_complete`
   - `SSEClient.dispatchFrame` 用 `KNOWN_EVENT_TYPE_SET` 主动过滤未知事件——新增类型必须同步改 `KNOWN_EVENT_TYPES` 与 `SSEEventType` 联合
   - 后端 R-20 列出 16 种事件，前端尚缺 `plan_update_success` / `plan_update_failed` / `plan_completed` / `step_fail` / `wait`；新增对应业务时同步补齐两侧

4. **禁止泄漏 SSE 连接**
   - 组件卸载时必须 `close()`：参考 `src/pages/Agent/index.tsx::useEffect` 的清理函数
   - 多任务并发场景（如 skill 导入）用 `Map<taskId, SSEClient>` 管理，结束/失败立即 `unsubscribe` 并从 Map 移除（参考 `src/store/skill.ts::subscribeImportTask`）
   - 不得多次 `subscribe` 同一 `SSEClient` 实例——`SSEClient` 自身会 throw `'SSE连接已存在'`

5. **禁止在前端实现自动重连**
   - 后端 R-45 明确"断线后客户端需重发起新对话；后端不缓存事件回放"
   - 不得在前端写指数退避重连循环；连接断开通过 `onError` 暴露给业务层，由用户重新触发动作
   - plan 中提到的"3s 指数退避，最多 5 次"与项目实际策略冲突，按本规则执行

## 要求行为

1. **订阅入口统一**
   - 业务侧通过 `new SSEClient()` 创建实例并调用 `subscribe(options, handlers)`：
     ```ts
     const client = new SSEClient();
     client.subscribe(
       { url, method: 'POST', body: payload },
       {
         onOpen: () => { /* 进入流式态 */ },
         onEvent: (type, data) => { /* 按 type 分发 */ },
         onError: (err) => { /* 提示并清理 */ },
         onComplete: () => { /* 收尾 */ },
       }
     );
     ```
   - GET 场景（如 skill 导入进度）传 `method: 'GET'`，不带 body

2. **事件分发**
   - `onEvent` 内部按 `SSEEventType` 做 narrow type discriminate，参考 `src/pages/Agent/index.tsx` 的 switch 模式
   - 业务状态变更走对应 Zustand store 的 action（如 `useAgentStore.getState().addToolCallStatus(...)`），不要在 SSE 回调里直接 setState 组件

3. **生命周期**
   - 单次会话：组件 `useRef<SSEClient | null>` 保存当前实例；新建会话前先 `close` 旧实例
   - 并发任务：store 内 `sseClients: Map<string, SSEClient>`，每个 taskId 一个实例；订阅前 `if (sseClients.has(id)) return`

4. **payload 校验**
   - 当前项目**未使用 zod**（package.json 无该依赖），事件 payload 类型靠 TS 联合 + 业务侧 `as unknown as XxxEvent` 断言
   - **不要在本规则范围内强行引入 zod**；如确需运行时校验，先开 ADR 评估对包体与构建链路的影响
   - 在补齐 zod 之前，新增事件类型必须：(a) 写明 `interface XxxEventData extends BaseEventData`；(b) 在 `onEvent` 入口对必填字段做手动 `if (!data.xxx) return` 守卫，避免 undefined 渗透

5. **超时与中止**
   - `SSEClient` 自带 60s 无数据超时（`this.timeout`），到期自动 `close`
   - 业务侧主动取消用 `client.close()`；不要直接 `client.abortController.abort()` 绕过状态机

## Agent 行为

- 检测到 `new EventSource(` → 拒绝并改写为 `new SSEClient()` + 既有 handlers 模式
- 检测到新增事件类型但未同步 `KNOWN_EVENT_TYPES` 与 `SSEEventType` → blocker
- 检测到组件级 SSE 用法缺 `useEffect` 清理 → 补 cleanup 函数
- 用户要求"加 SSE 自动重连" → 引用本规则 §禁止5 解释为何不做，并说明可以在 `onError` 提供"重连"按钮交给用户触发
- 用户要求"加 zod 校验" → 引导先开 ADR；不在本 rule 范围内私自添加依赖

## 可验证性

- 静态检查：
  - `grep -rn "new EventSource" src/` 应为空
  - `grep -rn "fetch.*text/event-stream" src/` 应仅出现在 `src/api/sse.ts`
  - `grep -rn "SSEClient" src/` 标识所有调用点，PR review 检查是否成对 `close`
- 类型层：`SSEEventType` 联合与 `KNOWN_EVENT_TYPES` 数组长度必须一致（可加 `assert` 单测）
- 契约层：前端 `SSEEventType` ⊆ 后端 `events/constants.go` 定义（由总仓 `validate-contracts.sh` 校验，详见 R-20）
