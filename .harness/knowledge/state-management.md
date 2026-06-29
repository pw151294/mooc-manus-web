# 状态管理（Zustand）

> 关联 rules：R-40-react §状态管理边界、R-42-ts（DTO 对齐）。
> 真实代码：`src/store/{agent,skill,tool,appConfig}.ts`。

## 为什么是 Zustand 而不是 Context / Redux / Recoil

R-40-react §禁止 3 明确：跨页面 / 跨组件树共享业务状态必须走 Zustand store；
**不得用 module-level 单例、不得用 React Context 充当业务 store**。理由：

- **更少 boilerplate**：`create<State>((set, get) => ({ ... }))` 一行起步，不用 Provider 包裹
- **可在 React 外取数**：`useAgentStore.getState()` 让 SSE handler / 非组件代码也能读写 state（参考 `src/pages/Agent/index.tsx::handleSendMessage`）
- **细粒度订阅**：组件 `useXxxStore((s) => s.field)` 只在该字段变化时重渲，无需 Context.memo

`grep -rn "createContext" src/` 当前为空，纪律落地。

## 4 个业务 store

```
src/store/
├── agent.ts        ─ Agent 对话（消息列表 + 能力装配 + 流式态）
├── skill.ts        ─ Skill 管理（providers / skills / versions / import tasks + SSE Map）
├── tool.ts         ─ Tool 管理（providers / functions）
└── appConfig.ts    ─ 模型配置（appConfigs CRUD）
```

每个业务域一个 store——按 R-40-react §要求 3 的"DDD-by-feature"划分，**不跨域合并**
（不要造 `useGlobalStore`），**不按 UI 拆分**（不要 `useChatWindowStore`）。

## 通用写法（按 `appConfig.ts` 模板）

```ts
import { create } from 'zustand';
import * as appConfigApi from '@/api/modules/appConfig';
import type { AppConfigDTO, AppConfigCreateRequest } from '@/types/appConfig';

interface AppConfigState {
  configs: AppConfigDTO[];
  loading: boolean;

  fetchConfigs: () => Promise<void>;
  createConfig: (data: AppConfigCreateRequest) => Promise<void>;
  updateConfig: (id: string, data: AppConfigUpdateRequest) => Promise<void>;
  deleteConfig: (id: string) => Promise<void>;
}

export const useAppConfigStore = create<AppConfigState>((set, get) => ({
  configs: [],
  loading: false,

  fetchConfigs: async () => {
    set({ loading: true });
    try {
      const configs = await appConfigApi.listAppConfigs();
      set({ configs, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
  // create / update / delete 共同模式：await api → 重新 fetchConfigs（不本地合并）
}));
```

关键约定：

1. **State + Action 同一 interface**：不区分 selector slice，全部扁平定义
2. **写操作走 `await api → 重新 fetch`**：保证服务端是真相之源，避免本地 cache 失同步
3. **`loading` 单字段**：列表 / 详情 / 任务分别可以拆（`loading` / `versionLoading` / `taskLoading`，见 `skill.ts`），不上 redux-toolkit 的 `RequestStatus` 抽象
4. **错误向上抛**：catch 内重置 loading 再 `throw`，由调用方（页面容器）用 antd `message.error(...)` 提示

## 4 个 store 的差异点

### agent.ts（对话状态 + 能力装配）

- **不带任何 middleware**（无 persist / immer / devtools）
- 关键 action 集中在 SSE 事件消费侧：`updateLastMessage` / `addToolCallStatus` / `updateToolCallStatus` 都"只动最后一条 assistant 消息"——背后假设见 [chat-ui-event-flow.md](./chat-ui-event-flow.md)
- `ensureConversationId()` 懒生成 uuid，避免组件首次渲染就占坑
- `resetConversation()` 是唯一能把 `messages` / `conversationId` / `isStreaming` 一起清空的入口

### skill.ts（Skill 管理 + 多任务 SSE）

- **唯一持有 `Map<string, SSEClient>` 的 store**：每个 importTask 一个 SSEClient
- `subscribeImportTask(taskId)`：去重 + 订阅 + 自动清理（`onComplete` / `onError` / 终态都调 `unsubscribeImportTask`）
- `unsubscribeAllImportTasks()`：组件级"清盘"入口，供 Skill 页面卸载时调用
- `set({ sseClients: new Map(sseClients) })` 而不是直接 mutate——确保 Zustand 触发订阅刷新（Map 实例引用变了才算 state 变更）

### tool.ts / appConfig.ts（最简 CRUD）

- 纯列表 + CRUD，没有 SSE / 长流
- 删除后 `await get().fetchXxx()` 重拉，不本地 splice
- 没有跨 store 调用（appConfig 不依赖 tool / skill）

## 跨 store 协作

`src/store/agent.ts` 持有的"能力装配"字段——`selectedConfig` / `selectedTools` /
`selectedSkills`——其值的"原始来源"分别落在 `appConfig.ts` / `tool.ts` / `skill.ts`。
形态是**消费方拷贝**：

```
ConfigPanel.tsx
  ├─ useAppConfigStore((s) => s.configs)   ← 读 appConfig store
  ├─ useToolStore((s) => s.functions)      ← 读 tool store
  ├─ useSkillStore((s) => s.skills)        ← 读 skill store
  └─ onChange → useAgentStore.getState().setSelectedConfig(...) ← 写入 agent store
```

agent store 拷贝完整 DTO（不是只存 id），这样发送 chat payload 时不用回查
其他 store——降低渲染期数据组装的耦合。

## 不用的能力

- **persist middleware**：不持久化任何 state；刷新页面后会话从空开始（与 R-41-sse §禁止 5 "不自动重连"一致）
- **immer middleware**：手写不可变更新（`map` / 展开运算），代码量可接受
- **devtools middleware**：未挂；调试靠 React DevTools + console
- **subscribeWithSelector**：未用；目前没有"在 store 外监听字段变化"的场景

引入任意 middleware 都需要先开 ADR——它们改变了 store 的运行时形态，会影响所有现有
store 的写法。

## TypeScript 边界（R-42-ts 协同）

- `State` interface 包含 state 字段 + action 签名，全部显式标注类型
- `import type` 拉 DTO（`verbatimModuleSyntax: true` 强制要求）
- DTO 类型从 `src/types/<domain>.ts` 来，**不在 store 文件内重新声明**（R-40-react §禁止 4）
- 没有 `any` / `as any`（`grep -rn ": any\|as any" src/store/` → 0 命中）

## 现状基线

截至当前 commit（`cbfe109`，2026-06-28）：

- `src/store/` 4 个文件：`agent.ts`（123 行）/ `skill.ts`（224 行）/ `tool.ts` / `appConfig.ts`（52 行）
- **无任何 Zustand middleware**：`create<State>((set, get) => ({ ... }))` 直写
- `grep -rn "createContext" src/` → 0 命中
- `grep -rn "subscribeWithSelector\|persist\|immer\|devtools" src/store/` → 0 命中
- `skill.ts` 是唯一持有 `Map<string, SSEClient>` 的 store，并实现"set 新 Map 实例"的更新模式
- 写操作统一"await api → 重新 fetch"，无本地乐观更新

## Agent 行为

- 用户要求"加一个跨页面状态" → 落新 `src/store/<domain>.ts`；如果属于已有域则补到现有 store
- 用户要求"用 Context 写一个全局 X" → 拒绝，引用 R-40-react §禁止 3，引导改用 Zustand
- 用户要求"加 persist 持久化登录态" → 先开 ADR；本 knowledge 不直接放行
- 用户要求"在子组件里用 useXxxStore()" → 评估是否唯一消费者；多消费场景下提升到容器层并通过 props 下传
