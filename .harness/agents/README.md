# 前端 Agents 索引（v1.0 占位）

本目录在 v1.0 阶段**暂不提供前端专用 subagent**。前端相关的契约校验，复用总仓 `event-contract-checker`（从前端 `src/api/sse.ts` / `src/types/*` 反查后端约束）即可覆盖大部分需求。

## v1.1 规划

预留以下 agent 槽位，待 v1.1 落地：

| 计划 Agent | 关联 Rule | 适用场景 |
|---|---|---|
| `react-conventions-checker` | R-40-react（计划新增）| React 组件命名 / hooks 使用 / props 类型；目录结构是否符合 `src/components` / `src/pages` / `src/api` 分区 |
| `sse-handling-checker` | R-41-sse（计划新增）| `src/api/sse.ts` 中事件订阅、断线重连、错误处理；与后端 R-20 联动 |
| `dto-type-sync-checker` | R-20-contracts | 前端 `src/types/` 与后端 `internal/applications/dtos/` 字段对齐（更细粒度，目前由 `event-contract-checker` 兜底）|

## 当前可用替代方案

- **跨仓契约**：使用总仓 `.harness/agents/event-contract-checker.md`
- **子模块纪律**：使用总仓 `.harness/agents/submodule-discipline-checker.md`
- **前端常规 review**：暂走人工 + ESLint / TSC + Prettier，未沉淀为 harness agent

## 添加新 agent 时

请同步更新本 README，并参考总仓 / 后端 agents 的三段式结构：
1. frontmatter（`name / description / when_to_use / inputs / outputs`）
2. 检查清单（3-5 条可机器/人工验证项，引用 rule_id）
3. 检查 prompt（30-50 行，可直接传给 subagent）
