# 对话 UI 事件流

> 关联 rules：R-40-react（组件 / store 边界）、R-41-sse（SSEClient 生命周期）、跨仓 R-20-contracts、后端 R-45-event。
> 真实代码：`src/pages/Agent/index.tsx` + `src/store/agent.ts` + `src/store/skill.ts::subscribeImportTask`。

## 端到端链路（Agent 对话）

```
用户在 ChatWindow 输入框敲回车
  └─ AgentPage.handleSendMessage(query)            ─ src/pages/Agent/index.tsx
       ├─ useAgentStore.getState()                  ← 取 selectedConfig / Tools / Skills
       ├─ if (!selectedConfig) message.error(...)
       ├─ addMessage({ role: 'user', ... })         ─ store action
       ├─ addMessage({ role: 'assistant', isStreaming: true, content: '' })
       ├─ startStreaming()
       ├─ accumulatedRef.current = ''               ← 累加流式文本的 useRef
       ├─ payload = buildChatPayload({ appConfigId, functionIds, skillRefs, systemPrompt, query, conversationId })
       ├─ sseClientRef.current?.close()             ← 关旧连接
       ├─ sseClient = new SSEClient(); sseClientRef.current = sseClient
       └─ sseClient.subscribe({ url: getChatUrl(), method: 'POST', body: payload }, handlers)
              ├─ onEvent(type, data)  ← 见下方分发表
              ├─ onError() → message.error('连接中断') + stopStreaming()
              └─ onComplete() → stopStreaming()
```

`useEffect(() => () => { sseClientRef.current?.close(); ... }, [])` 在组件卸载时清理，
对应 R-41-sse §禁止 4（禁止泄漏 SSE 连接）。

## onEvent 事件分发（实际 switch）

`src/pages/Agent/index.tsx` 第 98-151 行：

| 事件 type | data 强转类型 | store 动作 | UI 表现 |
|-----------|--------------|-----------|---------|
| `message` | `MessageEventData` | `accumulatedRef += data.message`; `updateLastMessage(accumulatedRef)` | 最后一条 assistant 消息内容增量更新（流式打字机） |
| `message_end` | —— | （仅注释占位） | 当前文本块结束标记；不动 store |
| `tool_call_start` | `ToolEventData` | `addToolCallStatus({ id, toolName, functionName, functionArgs, status: 'calling' })` | 在最后一条 assistant 消息下挂一个工具调用卡片（`ToolCallCard.tsx`） |
| `tool_call_complete` | `ToolEventData` | `updateToolCallStatus(id, { status: 'completed', result })` | 工具卡片标记完成 |
| `tool_call_fail` | `ToolEventData` | `updateToolCallStatus(id, { status: 'failed', result })` | 工具卡片标记失败 |
| `error` | `ErrorEventData` | —— | `message.error(data.error)`，不中断流 |
| `title` | `TitleEventData` | —— | 当前只 `console.log`，未接 store（与父仓 [`event-protocol.md`](../../../.harness/knowledge/event-protocol.md) 描述的"更新 conversation 列表"为目标态） |
| `done` | —— | `stopStreaming()` | 关闭流式光标 |
| `default` | —— | break | 未声明事件由 SSEClient 内 `KNOWN_EVENT_TYPE_SET` 提前过滤；这里仅兜底 |

**注意**：业务侧用 `data as MessageEventData` 等断言，未做运行时 zod 校验——这正是
R-42-ts §要求 4 描述的现状（暂未引入 zod）。

## Zustand 数据流（agent store）

`src/store/agent.ts` 用最朴素的 `create<State>((set, get) => ({ ... }))`，**不带任何
middleware**（无 devtools / persist / immer）。和事件流相关的 action：

```
addMessage(msg)              ─ push 到 messages 末尾
updateLastMessage(content)    ─ 替换最后一条消息的 content（用 map + idx 判断）
addToolCallStatus(toolCall)   ─ 给最后一条 assistant 消息的 toolCalls 追加
updateToolCallStatus(id, ...) ─ 用 toolCallId 在最后一条消息的 toolCalls 里找并合并
startStreaming() / stopStreaming() ─ 全局 isStreaming + 末条消息的 isStreaming 标记
resetConversation() ─ 清空 messages、conversationId、isStreaming
ensureConversationId() ─ 懒生成 uuidv4 并落到 state
```

`updateLastMessage` 与 `addToolCallStatus` 之所以都"只动最后一条消息"，是因为
SSE 事件流天然时序对齐——当 `tool_call_start` 到达时，对应的 assistant 消息一定是
`messages[length-1]`。如果未来引入"多 assistant 消息并发"形态（如 PlanAgent 同时跑多
step），这个假设会破，需要改成按 `messageId` 索引。

## 容器 vs 展示组件

- **容器（page index）**：`AgentPage` 负责 SSE 订阅、handler 路由、store action 调用、`useRef` 管理 SSEClient 与累加缓冲；本身渲染极少（只组合 `ConfigPanel` + `ChatWindow`）。
- **展示（同目录子组件）**：`ChatWindow.tsx` 通过 `onSend` / `onReset` props 向上回调；`MessageItem.tsx` 展示一条消息（包含 toolCalls）；`ToolCallCard.tsx` 渲染工具调用结果；`ConfigPanel.tsx` 选择模型 / 工具 / Skill。详见 [component-taxonomy.md](./component-taxonomy.md)。

## 另一条事件流：Skill 导入进度

`src/store/skill.ts::subscribeImportTask` 是 SSE 用法的第二种形态——**store 内并发管理**：

```
subscribeImportTask(taskId)
  ├─ if (sseClients.has(taskId)) return          ← 去重
  ├─ client = new SSEClient()
  ├─ client.subscribe({ url: buildImportProgressUrl(taskId), method: 'GET' }, {
  │      onEvent: (_type, data) => {
  │        event = data as unknown as ImportProgressEvent
  │        updateTaskProgress(taskId, event)
  │        if (event.status === 'success' || event.status === 'failed') unsubscribeImportTask(taskId)
  │      },
  │      onError: () => unsubscribeImportTask(taskId),
  │      onComplete: () => unsubscribeImportTask(taskId),
  │    })
  ├─ sseClients.set(taskId, client)
  └─ set({ sseClients: new Map(sseClients) })     ← 触发订阅者刷新
```

这里 `_type` 用下划线前缀因为该接口的事件只有一种（进度更新），无需按 type 分发；
`as unknown as ImportProgressEvent` 是 R-42-ts §要求 2 描述的"SSE 例外"——payload 类型靠业务侧手动守护。

## 与父仓事件协议的对齐点

[`mooc-manus-all/.harness/knowledge/event-protocol.md`](../../../.harness/knowledge/event-protocol.md)
是 16 种事件的唯一权威说明，本文档只描述"前端如何消费"。两点偏差：

1. 前端 `SSEEventType` 联合只声明 11 种（详见 R-41-sse §现状基线），未覆盖 plan
   流程的 `plan_update_success` / `plan_update_failed` / `plan_completed` / `step_fail` 与系统的 `wait`。
2. `title` 事件目前只 console.log，未接 conversation 列表更新——因为前端尚无"会话历史"页面。

新增事件时按 R-20-contracts 的"事件类型一致性"工作流：先改 `events/constants.go` →
再改 `KNOWN_EVENT_TYPES` + `SSEEventType` + 新增 EventData interface → 在
`AgentPage.onEvent` switch 补 case → CI 跑 `validate-contracts.sh`。
