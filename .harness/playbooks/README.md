# Playbooks 索引（mooc-manus-web 前端）

可重放的前端实现剧本。所有涉及"加页面 / 接组件库 / 优化产物"的动作走这里。规则正文见 `rules/`，本目录仅以 R-XX 短码引用。

## 何时进这里

- 接到产品需求要新增一个一级页面（如 `/dashboard`）→ `add-new-page.md`
- 想引入新的组件 / 工具库（如 `@tanstack/react-query`、`framer-motion`）→ `integrate-new-component-library.md`
- `npm run build` 产物体积过大 / 首屏慢 → `optimize-bundle-size.md`

## 前端剧本清单

| 剧本 | 适用 | 关联 rule |
|---|---|---|
| `add-new-page.md` | 新增一级页面 + 路由 + Store + API | R-40 / R-41 / R-42 / R-43 |
| `integrate-new-component-library.md` | 引入新依赖（UI / 状态 / 工具库） | R-40 / R-42 |
| `optimize-bundle-size.md` | 产物体积 / 首屏性能优化 | R-40 / R-42 |

## 通用规约

- 每份剧本结构：**前置条件 / 步骤 / 常见坑 / 验证 / Agent 行为**
- 路径基于真实结构：`src/pages/<Domain>/` / `src/api/modules/` / `src/store/` / `src/types/`
- 子仓 commit 风格 `feat(<scope>): ...` / `chore(<scope>): ...` / `perf(<scope>): ...`
- 子仓 push 之后由总仓单独升级指针（见总仓 `playbooks/upgrade-submodule.md`）

## 与其他目录

- 跨仓剧本（SSE 事件同步、端到端功能）见 `mooc-manus-all/.harness/playbooks/`
- 详细架构背景见 `knowledge/`（`chat-ui-event-flow.md` / `sse-client-architecture.md` / `state-management.md` / `component-taxonomy.md`）
- 后端剧本见 `mooc-manus/.harness/playbooks/`
