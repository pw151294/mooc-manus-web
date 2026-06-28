---
rule_id: R-40-react
severity: medium
---

# React 编码规范

mooc-manus-web 采用 React 19 + Vite + TypeScript + Ant Design + Zustand 技术栈。本规则锁定组件划分、hooks 规约、状态管理边界与目录结构，确保 AI 编码与项目既有形态一致。

## 禁止行为

1. **禁止条件 hook 与循环 hook**
   - 不得在 `if` / `for` / 早 `return` 之后调用 `useState` / `useEffect` / `useRef` / 自定义 hook
   - 不得在普通函数（非组件、非 `use*` 开头 hook）中调用 React hook
   - 违例由 `eslint-plugin-react-hooks` 兜底（已在 devDependencies）

2. **禁止自定义 hook 不以 `use` 开头命名**
   - 任何返回值依赖 React 状态/副作用的工具函数必须命名 `useXxx`，否则视为普通工具
   - `src/utils/` 与 `src/hooks/` 内的导出必须遵守该边界（`src/hooks/` 状态详见 §现状基线，新增 hook 一律落到此目录）

3. **禁止在多页面共享状态时绕过 Zustand**
   - 跨页面 / 跨组件树共享业务状态（Agent 会话、Skill 列表、Tool 装配、AppConfig）必须放在 `src/store/{agent,skill,tool,appConfig}.ts` 对应 store
   - 不得用 Module-level 单例对象、不得用 React Context 充当业务 store
   - 仅 UI 局部状态（开关、表单临时值）允许 `useState`

4. **禁止把业务类型散落到组件文件**
   - DTO / Domain 类型统一放 `src/types/<domain>.ts`，组件文件只能定义 props/local-state 等私有类型
   - 跨页面复用的类型必须从 `src/types/` 导入，不得在组件内重新声明

## 要求行为

1. **目录结构（项目实际形态）**

   ```
   src/
   ├── api/
   │   ├── request.ts            # axios 实例与拦截器
   │   ├── sse.ts                # SSEClient（详见 R-41-sse）
   │   └── modules/<domain>.ts   # 业务接口聚合
   ├── components/
   │   └── Layout/index.tsx      # 仅放跨页面共享 UI（侧边栏 / 顶栏）
   ├── pages/<Feature>/
   │   ├── index.tsx             # 页面入口
   │   └── <SubComponent>.tsx    # 同级拆分子组件
   ├── store/<domain>.ts         # Zustand store（每个业务域一份）
   ├── types/<domain>.ts         # TS 类型定义（与后端 DTO 对齐）
   ├── hooks/                    # 自定义 hook（状态详见 §现状基线）
   ├── router/index.tsx          # React Router 路由表
   ├── utils/                    # 纯函数工具（状态详见 §现状基线）
   └── constants/                # 常量（状态详见 §现状基线）
   ```

   - 新增页面 → 落 `src/pages/<Feature>/`，入口文件名 `index.tsx`，子组件平铺到同目录
   - 新增跨页面 UI 组件（按钮、卡片等通用形态）→ 落 `src/components/<Name>/`
   - **不要使用** plan 中提到的 `<Feature>/{index.tsx, hooks.ts, types.ts}` 三件套结构——本项目从未采用，强行引入会割裂既有形态

2. **组件职责划分**
   - 页面级组件（`src/pages/<Feature>/index.tsx`）负责：从 Zustand store 取数 / 调用 API / 编排子组件
   - 子组件（如 `ChatWindow.tsx` / `ConfigPanel.tsx`）专注渲染与本地交互，通过 props 接收数据与回调
   - 子组件不要直接 `useXxxStore()`；如必须，仅在该子组件确实是页面唯一消费方时允许，并在 PR 说明里点名

3. **Ant Design 优先**
   - 表单 / 表格 / 弹窗 / 消息 / Tree / Menu 等基础形态一律用 antd 组件，不得自造
   - 图标用 `@ant-design/icons`，不引第三方图标库
   - 全局消息用 `App.useApp()` 提供的 `message` / `notification`，不要直接 `import { message } from 'antd'`（Antd v5+ 静态方法已不推荐）

4. **TypeScript 风格**
   - 函数组件用 `const Foo: FC<Props> = (...) => { ... }`（参考 `src/pages/Agent/index.tsx`）
   - props 类型在文件顶部 `interface FooProps { ... }` 显式声明
   - 导入 type-only 符号用 `import type { ... }`，与 `verbatimModuleSyntax: true` 配合

## Agent 行为

- 用户要求"新增页面" → 默认按 `src/pages/<Feature>/index.tsx` 创建，跨域复用的状态写入 `src/store/<domain>.ts`
- 检测到"在子组件里 import Zustand store" → 提示是否提升到页面入口，仅在唯一消费者场景下放行
- 检测到"自造 Modal / Form / Table" → 引导使用 antd 对应组件
- 用户问"放哪里" → 引用本规则的目录结构图，不要凭空创造新约定
- 若用户坚持 `<Feature>/{index.tsx, hooks.ts, types.ts}` 三件套 → 说明项目当前未采用该形态，需先开 ADR 统一全仓

## 现状基线

截至当前 commit（`cbfe109`，2026-06-28）：
- `src/hooks/` → 空目录（0 文件）；新增自定义 hook 一律落于此处
- `src/utils/` → 空目录（0 文件）；新增纯函数工具落于此处
- `src/constants/` → 空目录（0 文件）；新增常量落于此处
- `grep -rn "createContext" src/` → 0 命中（业务状态全部走 Zustand store）
- `src/store/` 已落地：`agent.ts` / `skill.ts` / `tool.ts` / `appConfig.ts` 四个业务域
- 页面目录统一 `src/pages/<Feature>/index.tsx + 平铺子组件` 形态；未出现 `{index.tsx, hooks.ts, types.ts}` 三件套

## 可验证性

- ESLint：`eslint-plugin-react-hooks/rules-of-hooks` 已开，违例 `npm run lint` 报错
- 静态检查：
  - `grep -rn "useState\|useEffect" src/components/Layout/` 限制为 Layout 内部用，跨域不得出现
  - `grep -rn "createContext" src/` 期望为空（业务状态走 Zustand）
- 新增 hook 文件命名 `useXxx.ts`，路径 `src/hooks/`
- 目录结构由 `validate-harness.sh` 抽样校验：新页面目录是否含 `index.tsx`
