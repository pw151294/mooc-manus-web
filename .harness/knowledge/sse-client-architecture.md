# SSEClient 架构

> 关联 rules：R-41-sse（SSE 事件处理）、R-42-ts（TypeScript 严格度）、R-20-contracts（前后端契约）。
> 唯一实现：`src/api/sse.ts`（约 190 行，`class SSEClient` + `default export`）。

## 为什么不用浏览器原生 `EventSource`

浏览器 `EventSource` 只支持 GET、不能自定义 header、不能带 body。后端 chat 接口
`POST /api/v1/agent/chat` 要求 JSON body + `Accept: text/event-stream`，所以前端用
`fetch + ReadableStream + AbortController` 自己实现 SSE 客户端。R-41-sse §禁止 1 锁定这一选择，禁止任何代码直接 `new EventSource(...)`。

## 类结构（按 `src/api/sse.ts` 实际写法）

```ts
class SSEClient {
  private abortController: AbortController | null = null;
  private timeout: number = 60000;                       // 60s 无数据超时
  private timeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private isActive: boolean = false;

  subscribe(options: SSESubscribeOptions, handlers: SSEHandlers): void { ... }
  private async readStream(stream, handlers): Promise<void> { ... }
  private findFrameSeparator(buffer): { index; length } | -1 { ... }
  private dispatchFrame(frame, handlers): void { ... }
  private resetTimeout(): void { ... }
  close(): void { ... }
}
```

四个字段构成最小状态机：`abortController`（中止 fetch）、`timeout`/`timeoutTimer`
（无数据超时）、`isActive`（防止重复 subscribe 与 done 后误触 onComplete）。

## subscribe 的生命周期

```
subscribe()
  ├─ guard: isActive ? throw 'SSE连接已存在'
  ├─ new AbortController(); isActive = true; resetTimeout()
  ├─ fetch(url, { signal, method, headers: { Accept: 'text/event-stream', ... }, body })
  │    ├─ response.ok ? handlers.onOpen?.() : throw 'SSE 请求失败'
  │    └─ readStream(response.body, handlers)
  │         ├─ TextDecoder('utf-8').decode(chunk, { stream: true })
  │         ├─ findFrameSeparator: 在 buffer 里找 '\n\n' 或 '\r\n\r\n'
  │         ├─ 每个 frame 走 dispatchFrame
  │         └─ reader done → 处理 buffer 残留 → 退出循环
  └─ catch:
       ├─ AbortError → 静默吞掉（用户主动 close）
       └─ 其他 → close() + handlers.onError?.(error)
```

读完流后如果 `isActive` 仍为 true（说明没有显式 `done` 事件触发 close），
自动 `close()` 并 `handlers.onComplete?.()`。`done` 事件本身在 `dispatchFrame` 内
触发 `close()` + `onComplete()`，已结束就不重复。

## 帧解析（`dispatchFrame`）

SSE 帧格式：

```
event: <type>
data: <json or text>

```

`dispatchFrame` 按 `\r?\n` 切行，逐行解析 `field: value`：

- `event:` → `eventName`
- `data:` → push 到 `dataLines`
- 以 `:` 开头的注释行直接跳过
- 空行作为帧分隔由 `findFrameSeparator` 处理，不进 dispatchFrame

`dataLines.join('\n')` 后 `JSON.parse`；解析失败走 `handlers.onError?.(new Error('数据格式错误'))`。最终事件类型用
`(eventName || parsed.type) as SSEEventType` 兜底（兼容后端只发 `data:` 不发 `event:` 的情况）。

## 未知事件的主动过滤

```ts
const KNOWN_EVENT_TYPES: ReadonlyArray<SSEEventType> = [
  'message', 'message_end', 'tool_call_start', 'tool_call_complete',
  'tool_call_fail', 'error', 'done', 'title',
  'plan_create_success', 'step_start', 'step_complete',
];
const KNOWN_EVENT_TYPE_SET = new Set<string>(KNOWN_EVENT_TYPES);
```

`dispatchFrame` 在 `!KNOWN_EVENT_TYPE_SET.has(type)` 时直接 return，业务侧 `onEvent`
不会收到未知事件。**这是与后端 R-20 / 父仓
[`event-protocol.md`](../../../.harness/knowledge/event-protocol.md) 的契约接缝**：
新增事件类型必须同步 `KNOWN_EVENT_TYPES` 数组与 `SSEEventType` 联合类型，否则会被默默丢弃。

后端目前发 16 种，前端只声明 11 种；尚缺 `plan_update_success` / `plan_update_failed`
/ `plan_completed` / `step_fail` / `wait`（详见 R-41-sse §现状基线）。

## 超时与中止

- **60s 无数据自动关闭**：`resetTimeout()` 在 subscribe / 每次 `reader.read()` 收到数据时调用，到期 `console.warn('SSE connection timeout')` + `close()`。
- **业务主动取消**：调用 `client.close()`。`close()` 内部：
  - 守卫 `if (!this.isActive) return`，可重复调用幂等
  - `clearTimeout(timeoutTimer)`
  - `abortController.abort()` 中止 fetch；catch 内 `AbortError` 静默吞掉，**不**触发 `onError`
- **不实现自动重连**：R-41-sse §禁止 5 明确不做指数退避；断线 `onError` 抛给业务层，由用户重新触发动作。

## 错误处理矩阵

| 触发源 | 行为 |
|--------|------|
| `response.ok === false` | throw → catch → `close()` + `onError` |
| `response.body == null` | 同上 |
| `JSON.parse` 失败 | `onError(new Error('数据格式错误'))`，**不关闭连接**，继续读后续帧 |
| 网络异常 / `reader.read()` 抛错 | catch → `close()` + `onError` |
| 60s 无数据 | `close()`（不主动调 `onError`，业务通过 `onComplete` 收尾） |
| 用户 `close()` | `AbortError` 静默 |
| 后端发 `done` | `dispatchFrame` 内 `close()` + `onComplete()` |
| 流自然结束（无 done） | `readStream` 退出后 `close()` + `onComplete()` |

## 使用形态（两种）

- **单实例（`useRef<SSEClient>`）**：组件级一次只跑一个会话。参考
  `src/pages/Agent/index.tsx`：`sseClientRef.current?.close()` 后 `new SSEClient()` 再
  `subscribe`，`useEffect` 卸载清理。详细流转见
  [chat-ui-event-flow.md](./chat-ui-event-flow.md)。
- **并发 Map（`Map<taskId, SSEClient>`）**：多个独立任务同时订阅。参考
  `src/store/skill.ts::subscribeImportTask`：`if (sseClients.has(taskId)) return` 去重，结束/失败/onError/onComplete 都立即
  `unsubscribeImportTask(taskId)` 从 Map 移除并 `close`。

## 现状基线

截至当前 commit（`cbfe109`，2026-06-28）：

- `src/api/sse.ts` 190 行，单一 `class SSEClient`，无子类
- `grep -rn "new EventSource" src/` → 0 命中
- `grep -rn "fetch.*text/event-stream" src/` → 仅 `src/api/sse.ts`
- 未引入 `zod`；payload 校验靠 TS 联合 + 业务侧 `as unknown as XxxEvent`（R-42-ts §要求 4）
- 未实现自动重连、未实现 `Last-Event-ID` 重放（后端也不缓存事件，见父仓 R-45-event）
- 11 种 `SSEEventType` ⊊ 后端 16 种事件，缺口在 R-41-sse §现状基线列出
