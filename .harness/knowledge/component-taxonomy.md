# 组件分层

> 关联 rules：R-40-react（目录结构 / 组件职责）、R-43-a11y（antd 优先）。
> 真实代码：`src/components/Layout/` + `src/pages/<Feature>/`。

## 三类组件

mooc-manus-web 不区分"原子 / 分子 / 模板"那套 atomic design，而是按**职责**分三类：

```
┌────────────────────────────────────────────────────────┐
│ 1. 全局壳组件（src/components/Layout/index.tsx）        │
│    - antd <Layout> / <Sider> / <Menu> / <Outlet>       │
│    - 路由切换、菜单高亮、Header 与 Sider 布局           │
│    - 全局唯一，由 src/router/index.tsx 包裹             │
└────────────────────────────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────┐
│ 2. 页面容器（src/pages/<Feature>/index.tsx）            │
│    - 从 Zustand store 取数 / 调 API / 编排子组件        │
│    - 持有 useRef / useEffect / SSE 订阅                 │
│    - 直接消费 useXxxStore()                             │
└────────────────────────────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────┐
│ 3. 展示子组件（src/pages/<Feature>/<SubComponent>.tsx） │
│    - 平铺在 Feature 目录下，不另开子目录                 │
│    - props 接收数据与回调，纯渲染 + 本地交互             │
│    - 默认不直接 useXxxStore()（R-40-react §要求 2）     │
└────────────────────────────────────────────────────────┘
```

## 实际目录形态（按 `src/pages/` 现状）

```
src/pages/
├── Agent/
│   ├── index.tsx          ← 容器：SSE 订阅 + store 编排
│   ├── ChatWindow.tsx     ← 展示：消息列表 + 输入框
│   ├── ConfigPanel.tsx    ← 展示：左侧能力装配
│   ├── MessageItem.tsx    ← 展示：单条消息
│   └── ToolCallCard.tsx   ← 展示：工具调用卡
├── AppConfig/
│   ├── index.tsx          ← 容器
│   ├── ConfigCard.tsx     ← 展示
│   └── ConfigForm.tsx     ← 展示（antd Form）
├── Skill/
│   ├── index.tsx
│   ├── ImportProviderModal.tsx
│   ├── ImportTasks.tsx
│   ├── ProviderTree.tsx
│   ├── SkillCard.tsx
│   └── SkillDetailModal.tsx
└── Tool/
    ├── FunctionCard.tsx
    ├── FunctionForm.tsx
    ├── Functions.tsx       ← 二级容器（被 Tool 子路由消费）
    ├── ProviderCard.tsx
    ├── ProviderForm.tsx
    └── Providers.tsx       ← 二级容器
```

**Tool 是唯一例外**：它没有 `index.tsx`，而是把 `Providers.tsx` 与 `Functions.tsx`
作为两个独立子路由（在 `router/index.tsx` 里挂在 `/tools/providers` 与
`/tools/functions`，对应 `Layout` 菜单的子项）。这是历史选择，新增页面**不要照搬**——
默认按 `<Feature>/index.tsx` 写入口（R-40-react §要求 1）。

## `src/components/` 的边界

```
src/components/
└── Layout/
    └── index.tsx          ← 唯一文件
```

目前 `src/components/` 只有 `Layout`。R-40-react §要求 1 规定：

- 跨页面共享的"通用 UI 形态"（按钮、卡片、面板）才下沉到 `src/components/<Name>/`
- 仅在单一 Feature 内使用的组件**留在** `src/pages/<Feature>/`
- antd 已覆盖 80%+ 通用形态（Button / Modal / Form / Tree / Table / Tooltip），不要重复造轮子

这也解释了为什么 `src/components/` 目前只有 Layout——其余通用 UI 全部直接用 antd。

## 与 plan 的偏差（reality-first）

plan 提到的 `<Feature>/{index.tsx, hooks.ts, types.ts}` 三件套结构**项目从未采用**。
R-40-react §要求 1 已明确写入 agent 行为：

> 若用户坚持 `<Feature>/{index.tsx, hooks.ts, types.ts}` 三件套 → 说明项目当前未采用该形态，需先开 ADR 统一全仓

类型统一放 `src/types/<domain>.ts`，hook 一律到 `src/hooks/`（目前空目录），不在
Feature 内本地化。

## a11y 协同（R-43）

三类组件的 a11y 责任划分：

- **Layout 壳**：antd `<Layout>` / `<Sider>` / `<Header>` / `<Content>` / `<Menu>` 已对应 ARIA landmark；不需要额外标注。
- **页面容器**：在 SSE 流式更新场景，用 `aria-live="polite"` 区域承载新消息，**不要每帧抢焦点**（R-43-a11y §要求 3）。
- **展示子组件**：纯图标按钮必须 `aria-label` 或外层 `<Tooltip>`；删除/确认走 `Modal.confirm`；Modal / Drawer 一律用 antd 内建（自带 focus trap + Esc）。

## 命名约定

- 容器：`index.tsx`（页面入口）或 `Functions.tsx` / `Providers.tsx`（Tool 的二级容器历史例外）
- 展示子组件：PascalCase 单文件，如 `ChatWindow.tsx` / `SkillCard.tsx` / `ConfigForm.tsx`
- 命名后缀：`Card` / `Form` / `Modal` / `Panel` / `Tree` / `Window` / `Tasks` —— 一眼能看出形态
- props 接口在组件文件顶部 `interface FooProps { ... }`（R-40-react §要求 4）

## 跨页面共享形态怎么办

如果出现"两个 Feature 都需要某个组件"（如未来加 Confirm 弹窗、Empty 占位、Page Header），按 R-40-react §要求 1：

1. 提到 `src/components/<Name>/index.tsx`
2. 若依赖 antd 已有组件，优先做"二次封装"而非自造（如 `<PageHeader>` 内部用 antd Typography + Space）
3. 仍然只放纯展示形态；业务状态留在调用方页面的容器层

## 现状基线

截至当前 commit（`cbfe109`，2026-06-28）：

- `src/components/` 仅含 `Layout/index.tsx`（71 行）
- `src/pages/` 4 个 Feature：`Agent` / `AppConfig` / `Skill` / `Tool`
- Tool Feature 无 `index.tsx`，采用 `Providers.tsx` + `Functions.tsx` 双子路由形态（历史例外）
- 所有 Modal 来自 antd（`ImportProviderModal.tsx` / `SkillDetailModal.tsx` 都包裹 `<Modal>`）
- 无 ARIA / role 显式标注（`grep -rn "aria-\|role=" src/` 为空）——a11y 完全依赖 antd 内建（R-43-a11y §现状基线）
- 子组件**不**直接 `useXxxStore()` 的纪律由 PR review 兜底；目前展示组件全部走 props
