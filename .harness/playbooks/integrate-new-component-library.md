# 引入新组件 / 工具库

把外部 npm 包接入项目（如 `@tanstack/react-query`、`framer-motion`、`recharts`）。本剧本约束选型、装载方式、与既有 antd / zustand 生态共存。关联 R-40（React 规范）、R-42（TS 严格）。

## 前置条件

1. **判断必要性**：能否用既有 antd / zustand / dayjs / lodash-es 完成？能用就别加新依赖
2. 已检查包：维护状态（最近 6 个月有 release）、license（MIT/Apache 2.0 优先）、weekly downloads、TS 类型支持（自带 d.ts 或 `@types/` 完整）
3. 已确认与 React 19 / antd 6.x / Vite 兼容
4. 安全：`npm audit` 看依赖里有无 CVE；包名相似的 typosquatting 留心（如 `react-router` vs `react-routes`）

## 步骤

```bash
cd /path/to/mooc-manus-all/mooc-manus-web
git switch -c chore/dep-<package>
```

### 1. 安装（pin 版本）

```bash
npm install <package>@<exact-version>   # 不用 ^ / ~，pin 到具体版本
# 如 TS 类型不内置
npm install --save-dev @types/<package>@<exact-version>
```

⚠️ R-32（敏感信息）：包若需要 API key，key 走 `.env` + `import.meta.env`，不直接写源码。

### 2. 决定装载方式

| 方式 | 适用 | 例 |
|---|---|---|
| 全局 provider | 全应用都用（如 react-query） | 在 `src/main.tsx` 包 `<App />` |
| 按页面 import | 仅个别页面使用（如 `recharts`） | 在页面文件 `import { LineChart } from 'recharts'` |
| 工具函数 | 无副作用工具（如 `nanoid`） | 直接 `import` 即用 |

**默认按页面 import**：能 lazy-load 就 lazy（见 `optimize-bundle-size.md`）。

### 3. 类型与封装

- 如包导出类型不规范，在 `src/types/vendor/<package>.d.ts` 补声明，不要直接 `as any`（R-42）
- 跨页面频繁使用的部分可在 `src/utils/` 包一层，集中默认配置（如 react-query 的 `QueryClient` 默认 `staleTime`）

### 4. 与 antd / zustand 共存

- 状态管理库（如 react-query）：用于服务端缓存；本地共享业务状态仍走 zustand（R-40 第 3 条）
- UI 组件库（如 mui / chakra）：**强烈不推荐**与 antd 并存；如必须，限制到隔离子域，并写 ADR 说明分界
- 样式（如 styled-components）：与 antd 的 `theme-token` 体系协调，避免双套 design token

### 5. 测试 & commit

```bash
npm run lint && npm run build
# 看 dist 体积变化：build 输出已含 chunk 大小
git add package.json package-lock.json src/...
git commit -m "chore(dep): 引入 <package>@<version> 用于 <场景>"
git push -u origin chore/dep-<package>
```

## 常见坑

1. **未 pin 版本**：用 `^x.y.z` → 几周后构建出非预期版本，行为漂移。pin 到具体版本，由 dependabot 等工具走升级流程。
2. **typosquatting**：包名一字之差（`lodahs-es` / `react-toast` vs `react-hot-toast`）。仔细比对官方仓库链接。
3. **类型用 any 兜底**：缺 `d.ts` 时 `import xxx from 'pkg'; (xxx as any).foo` → 违反 R-42。先看 `@types/<pkg>` 或自己写 d.ts。
4. **重复造轮子**：项目已有 `dayjs` 又装 `date-fns`、有 `lodash-es` 又装 `ramda`。先 `grep package.json`。
5. **CSS 全局污染**：包带全局样式（如老式 reset.css）覆盖 antd → 视觉走样。改成 scoped import 或 module css。
6. **首屏体积膨胀**：把仅个别页面使用的库放进全局 import → bundle 暴涨。走 `optimize-bundle-size.md`。

## 验证

```bash
npm run lint && npm run build
npm audit --omit=dev          # 高危漏洞为 0
HARNESS_ROOT=.harness ./.harness/scripts/validate-harness.sh

# 体积对比
# 在引入前先记一份 dist/assets/*.js 大小，引入后对比
# build 输出的 "rendering chunks" 报告里关注 main / vendor chunk 增量
```

## Agent 行为

- 接到"引入 X" → 先问能否用既有依赖；如能用就劝阻
- 检查 license 与维护状态；超过 1 年无 release 或 license 非主流 → 提示风险
- 看到 `^` / `~` 浮动版本 → 提示 pin（或确认 dependabot 已 enable）
- 看到全局 import 但只 1 个页面用 → 提示改 lazy / 按需 import
- 看到 `any` 兜底类型 → reject（R-42）
- 看到引入第二个 UI 组件库（与 antd 并存）→ 强制要求写 ADR
- ⚠️ 注意 R-32：包需要 key 时确认 `.env` 路径且不入仓
- 装包前 `npm audit` 没跑 → 自动跑一次
