# Bundle 体积 / 首屏性能优化

`npm run build` 产物变大、首屏白屏久。本剧本提供按优先级排序的减肥手段。vite 配置入口 `vite.config.ts`，技术栈 React 19 + antd + zustand。关联 R-40（React 规范）、R-42（TS 严格）。

## 前置条件

1. 已 `npm run build` 拿到当前基线：`dist/assets/*.js` 大小、`index-*.js`（主 chunk）大小
2. 已用 `npm run build -- --report` 或 `rollup-plugin-visualizer` 看依赖占比（必要时先装该 plugin）
3. 明确目标：「main chunk < N KB gzip」「LCP < 2.5s」之类可度量指标
4. 阅读 vite 现有 `vite.config.ts`（极简，无定制 build options）

## 步骤

```bash
cd /path/to/mooc-manus-all/mooc-manus-web
git switch -c perf/bundle-<scope>
```

### 1. 量化基线

加 visualizer 看 chunk 分布：

```bash
npm install --save-dev rollup-plugin-visualizer@<pin>
```

在 `vite.config.ts` 的 `plugins` 加入（仅 dev / 临时调试，最后可移除）：

```ts
import { visualizer } from 'rollup-plugin-visualizer';
plugins: [react(), visualizer({ filename: 'dist/stats.html', gzipSize: true })],
```

`npm run build` 后打开 `dist/stats.html`，按 gzip 大小排序。

### 2. 路由级 lazy

`src/router/index.tsx` 现在所有页面同步 import。改成 `React.lazy + Suspense`：

```tsx
import { lazy, Suspense } from 'react';
const AgentPage = lazy(() => import('@/pages/Agent'));
// ... 用 <Suspense fallback={<Spin />}><AgentPage /></Suspense> 包
```

每个一级页面自成 chunk，首屏只加载落地路由对应包。

### 3. antd 按需

antd 6.x 已 ESM tree-shake，但确认：
- 不要 `import * as antd from 'antd'`
- 图标用 `@ant-design/icons` 具名 import，禁止整体 import

### 4. manualChunks（依赖分组）

`vite.config.ts` 在 `build.rollupOptions.output.manualChunks` 把大依赖拆出来（vendor 缓存友好）：

```ts
manualChunks: {
  'vendor-react': ['react', 'react-dom', 'react-router-dom'],
  'vendor-antd':  ['antd', '@ant-design/icons'],
},
```

### 5. 删冗余依赖

- `npm ls --depth=0` 看 top-level；同类重复（`moment`+`dayjs` / `lodash`+`lodash-es`）择一保留
- 单次使用的大包替换为更小的 / 自实现；`npm prune` 清 phantom dependencies

### 6. 资源优化

- 图片：`src/assets/` 中 >100KB 的图换 webp / 拆 sprite
- 字体：子集化或用系统字体；gzip / brotli 走 nginx / CDN 层

### 7. 测试 & commit

```bash
npm run build
# 对比 dist/assets/*.js 与基线
git add -A
git commit -m "perf(bundle): <具体优化项> 减少 <N>KB gzip"
git push -u origin perf/bundle-<scope>
```

## 常见坑

1. **lazy 导致首屏 flash**：lazy 一级路由时 fallback 没设 → 短暂白屏。`<Suspense fallback={<Spin />}>` 是必须的。
2. **manualChunks 切太碎**：每个 vendor 单独 chunk → HTTP 请求暴涨；HTTP/2 下也别拆超过 ~6 个 vendor chunk。
3. **antd locale 漏 tree-shake**：误 `import 'antd/dist/reset.css'` 之外的整包 CSS。
4. **visualizer 留在生产**：临时调试用完忘删 plugin → 多 1 个 stats.html 进 dist。提交前移除或加 `process.env.ANALYZE`。
5. **删依赖后没跑全量**：删个看似没用的包，结果某个 lazy 页面 runtime 才发现要它。`npm run build && npm run preview` 走主要路径。
6. **不衡量就动手**：优化前后没数据对比 → 容易做无用功。每步 commit message 写"-N KB"。

## 验证

```bash
npm run build
ls -lh dist/assets/*.js              # 主 chunk 体积下降
npm run preview                      # 本地起 prod build，过一遍核心路径
# Lighthouse / Chrome devtools Performance：LCP / TTI 改善
HARNESS_ROOT=.harness ./.harness/scripts/validate-harness.sh
```

## Agent 行为

- 接到"优化体积" → 先要基线数据；没有 stats 就先帮装 visualizer
- 看到优化 PR 没附「优化前 / 优化后 KB」对比 → 退回补
- 看到 lazy 后没补 Suspense fallback → 提示加 `<Spin />`
- 看到 manualChunks 切超过 ~6 个 vendor → 提示合并
- 看到 visualizer plugin 留在生产构建 → 提示用 `if (env.ANALYZE)` 包
- 看到删依赖未跑 `npm run preview` 通验主要路径 → 提示补
- ⚠️ 注意 R-42：优化过程中不要用 `// @ts-ignore` 来绕过 lazy 引入产生的类型问题
- 一次优化想动 3+ 处 → 拆 commit，每个 commit 单独可量化
