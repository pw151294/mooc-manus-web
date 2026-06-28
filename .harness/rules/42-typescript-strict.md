---
rule_id: R-42-ts
severity: medium
---

# TypeScript 严格模式

mooc-manus-web 使用 TypeScript ~6.0.2，配置入口 `tsconfig.app.json`。本规则锁定类型严格度、`any` 使用边界与后端 DTO 对齐要求，与总仓 R-20-contracts（前后端契约，详见 `mooc-manus-all/.harness/rules/20-cross-repo-contracts.md`）协同。

## 禁止行为

1. **禁止使用 `any` 类型**
   - 不得显式标注 `: any` / `as any` / `Array<any>` / `Record<string, any>`
   - 不得用 `// @ts-ignore` 静默错误——必须用 `// @ts-expect-error <reason>` 并写明原因（如三方库 d.ts 缺失）
   - 详见 §现状基线，新增违例视为回退

2. **禁止用 `unknown` 后立即类型断言**
   - `JSON.parse` / `fetch` 返回值用 `unknown` 接收后必须 narrow（typeof / instanceof / 用户自定义 type guard），不得 `as XxxDTO` 一步到位
   - 例外：SSE payload 与后端 DTO 已在 R-41-sse 说明，因暂无 zod，允许 `data as unknown as XxxEvent` 但必须在 `onEvent` 入口手动守卫必填字段

3. **禁止禁用现有严格选项**
   - `tsconfig.app.json` 当前已开：`noUnusedLocals` / `noUnusedParameters` / `noFallthroughCasesInSwitch` / `erasableSyntaxOnly` / `verbatimModuleSyntax`
   - 不得通过单文件 `// @ts-nocheck` 或全局关闭这些选项绕过编译错误

4. **禁止前端 DTO 字段与后端不一致**
   - `src/types/<domain>.ts` 必须与 `mooc-manus/internal/applications/dtos/<domain>.go` 字段一一对应
   - 字段命名 camelCase（与后端 JSON tag 一致）
   - 可空性：Go `*Type` / `omitempty` → TS `Type | null` 或可选 `field?: Type`
   - 枚举值（如 skill `status`）双侧必须同源；前端硬编码字符串字面量 union（详见 `src/types/skill.ts`）

## 要求行为

1. **`tsconfig.app.json` 严格度路线**
   - 当前未开 `strict: true`（项目处于渐进迁移期）；新增代码按"等价于 strict"的要求写：
     - 函数参数与返回值显式标注类型
     - 组件 props 用 `interface FooProps` 显式声明
     - 不依赖隐式 `any`
   - **目标**：在 `tsconfig.app.json` 启用 `"strict": true`（含 `strictNullChecks` / `noImplicitAny` / `strictFunctionTypes`）；启用前需先开 ADR 评估存量改造工作量
   - 在 strict 启用前，新增文件可以局部加 `// @ts-strict` 或在 PR 标注"该文件已按 strict 写"

2. **类型导入用 `import type`**
   - `verbatimModuleSyntax: true` 已开，type-only 符号必须 `import type { Foo } from '...'`，运行时符号用普通 `import`
   - 混合导入：`import { useState, type FC } from 'react'`

3. **DTO 对齐流程（参考 R-20-contracts）**
   - 后端新增 DTO → 前端在 `src/types/<domain>.ts` 增加对应 interface
   - 字段类型映射：
     | Go | TS |
     |----|----|
     | `string` | `string` |
     | `int / int64` | `number` |
     | `bool` | `boolean` |
     | `*T` / `omitempty` | `T \| null` 或 `field?: T` |
     | `[]T` | `T[]` |
     | `time.Time`（JSON 序列化后） | `string` |
     | enum 字符串常量 | `'a' \| 'b' \| 'c'` 字面量 union |
   - 修改 DTO 字段 → 前后端必须同 PR 改完，CI 卡 `validate-contracts.sh`

4. **运行时校验（zod 替代方案）**
   - 项目**当前未依赖 zod**（package.json 已确认）；plan 提到"API 响应类型必须由 zod schema 推导"为目标态而非现状
   - 在引入 zod 前，对外部输入的运行时校验由：
     - axios 拦截器（`src/api/request.ts`）统一处理 HTTP 错误码与 `code` 字段
     - 业务侧对必填字段显式 `if (!data.xxx)` 守卫
   - 引入 zod 必须先开 ADR，约定：单点 schema 同时产出 TS 类型与运行时校验器；后端 DTO 变动同步 schema

## Agent 行为

- 检测到 `: any` / `as any` → 拒绝并要求 narrow 到具体类型或用 `unknown` + type guard
- 检测到 `// @ts-ignore` → 改写为 `// @ts-expect-error <reason>` 并要求填 reason
- 用户要求"快速塞个 any 先跑通" → 拒绝，引导用 `unknown` + 守卫；如确需绕过，要求 PR 备注计入 retro
- 用户要求"开 strict mode" → 先用 `tsc -b --strict` 抽样跑现存代码，统计待修点，再开 ADR
- 用户要求"加 zod" → 先开 ADR，本 rule 不直接放行

## 现状基线

截至当前 commit（`cbfe109`，2026-06-28）：
- `grep -rn ": any\|as any\|<any>" src/` → 0 命中
- `grep -rn "@ts-ignore" src/` → 0 命中
- `grep -rn "@ts-nocheck" src/` → 0 命中
- `tsconfig.app.json` 未开启 `"strict": true`（仅启用 `noUnusedLocals` / `noUnusedParameters` / `noFallthroughCasesInSwitch` / `erasableSyntaxOnly` / `verbatimModuleSyntax`）
- `package.json` 未依赖 `zod`，外部输入运行时校验靠 axios 拦截器 + 业务侧手动守卫
- ESLint `@typescript-eslint/no-explicit-any` 未配置为 error

## 可验证性

- 编译：`npm run build` 内含 `tsc -b`，任何 `any` 隐式推导会触发现有 lint
- ESLint：`@typescript-eslint/no-explicit-any` 当前未开启为 error；启用前需先开 ADR 评估对存量代码影响，过渡期靠 PR review + 上述 `grep` 静态检查兜底
- 静态检查：
  - `grep -rn ": any\|as any" src/ --include="*.ts" --include="*.tsx"` 应为空
  - `grep -rn "@ts-ignore" src/` 应为空（全部用 `@ts-expect-error`）
  - `grep -rn "@ts-nocheck" src/` 应为空
- 契约层：前端 `src/types/` 与后端 DTO 一致性由总仓 `validate-contracts.sh` 校验（详见 R-20-contracts）
