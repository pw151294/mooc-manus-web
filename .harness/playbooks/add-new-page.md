# 新增一级页面

新增一个一级路由页面（如 `/dashboard`），完整链路：路由 → 页面组件 → API 调用 → Store（如有跨页面状态） → 类型定义。关联 R-40（React 规范）、R-41（SSE 处理）、R-42（TS 严格）、R-43（a11y）。

## 前置条件

1. 需求清晰：页面要展示什么数据 / 触发什么交互 / 是否需要 SSE
2. 后端 API 已就绪（GET 列表 / POST 操作等）；如需新接口先在后端落实并升级指针
3. 已读 `knowledge/component-taxonomy.md` 与 `knowledge/state-management.md`，理解现有 `Agent / AppConfig / Skill / Tool` 页面的形态

## 步骤

```bash
cd /path/to/mooc-manus-all/mooc-manus-web
git switch -c feat/page-<domain>
```

### 1. 类型定义

`src/types/<domain>.ts`：

```ts
export interface <Domain>Item {
  id: string;
  name: string;
  // 字段名与后端 DTO 对齐（camelCase，R-20）
}
```

⚠️ R-42：不得用 `any`；从 API 拿来的数据先以 `unknown` 接收再 narrow，或直接以业务接口断言但确保字段守卫。

### 2. API client

`src/api/modules/<domain>.ts`：

```ts
import request from '@/api/request';
import type { <Domain>Item } from '@/types/<domain>';

export const list<Domain> = () => request.get<<Domain>Item[]>('/api/v1/<domain>');
export const create<Domain> = (body: Partial<<Domain>Item>) =>
  request.post<<Domain>Item>('/api/v1/<domain>', body);
```

### 3. Store（仅当跨页面共享状态时）

`src/store/<domain>.ts`，沿用 zustand 模式（参考 `store/agent.ts` / `store/skill.ts`）：

⚠️ R-40 第 3 条：跨页面状态必须走 zustand store；不要用 module 单例 / React Context。

### 4. 页面组件

`src/pages/<Domain>/index.tsx`（参考 `src/pages/Agent/index.tsx` 结构）：

```tsx
import { useEffect, useState } from 'react';
import { Button, Table } from 'antd';
import { list<Domain> } from '@/api/modules/<domain>';

const <Domain>Page = () => {
  const [data, setData] = useState<<Domain>Item[]>([]);
  useEffect(() => { list<Domain>().then((r) => setData(r.data)); }, []);
  return <Table dataSource={data} rowKey="id" columns={[/* ... */]} />;
};
export default <Domain>Page;
```

⚠️ R-43：交互用 antd `<Button>` / `<Menu.Item>`，避免 `<div onClick>`；自定义交互补 `role` + `tabIndex` + `onKeyDown`。

### 5. 路由注册

`src/router/index.tsx` 在 `children` 数组追加：

```tsx
{ path: '<domain>', element: <<Domain>Page /> },
```

如 Layout 的侧边菜单需要新增入口，改 `src/components/Layout/...`。

### 6. SSE 订阅（仅当需要实时流）

走总仓 `add-new-event-type.md` 前端段；订阅入口必须用 `import SSEClient from '@/api/sse'`，组件 unmount 时 `close()`（R-41）。

### 7. 构建 & commit

```bash
npm run lint && npm run build
git add -A
git commit -m "feat(page): 新增 <domain> 页面"
git push -u origin feat/page-<domain>
```

## 常见坑

1. **DTO 字段名漂移**：后端 `*Type` 对应前端 `Type | null`，camelCase 一致（R-20）。fixture 不要硬编码 mock 类型，从 `types/<domain>` 来。
2. **跨页面状态散落到组件**：父子 props drilling 三层以上 → 走 zustand store（R-40 第 3 条）。
3. **裸 div 当按钮**：`<div onClick>` 让屏幕阅读器跳过（R-43）。
4. **`any` 兜底**：`as any` 把类型问题压下去（R-42）。
5. **SSE 连接泄漏**：组件 unmount 没 close → 多次进出页面累积连接（R-41）。
6. **路由忘加 menu 入口**：能访问但侧栏点不开。

## 验证

```bash
npm run lint          # 0 warnings
npm run build         # 通过 tsc + vite build
HARNESS_ROOT=.harness ./.harness/scripts/validate-harness.sh
npm run dev           # 手动验：路由可达、a11y 大致检查（Tab 键盘可达）
```

## Agent 行为

- 接到"加页面" → 先问展示什么 / 是否需要 SSE / 是否跨页面共享状态；不直接动代码
- 看到 PR 用 `<div onClick>` 当主要交互 → 提示用 antd Button（R-43）
- 看到 `any` 出现 → 提示改 `unknown` + narrow 或显式接口（R-42）
- 看到跨页面状态用 React Context 充当 store → 提示走 zustand（R-40 第 3 条）
- 涉及 SSE 但没用 `@/api/sse` → 阻止（R-41 第 1 条）
- ⚠️ 注意 R-20：从 API 返回的数据字段与 `src/types/<domain>` 不一致时，先确认是后端漂移还是前端类型滞后，避免随手 `as` 覆盖
- 测试只验 happy path → 提示补 loading / error / empty 三态
