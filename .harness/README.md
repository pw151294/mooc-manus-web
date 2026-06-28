# mooc-manus-web Harness（前端）

本目录承载 mooc-manus-web 前端（React + TypeScript + SSE 客户端）专属约束、知识与剧本。

**继承**：`../mooc-manus-all/.harness/`（跨仓共识、契约、安全 rules）。

## 关系图

```
mooc-manus-all/.harness/  ← 父
       ↑ inherits
mooc-manus-web/.harness/  ← 本仓
       ↓ sync-bridges
mooc-manus-web/CLAUDE.md / AGENTS.md / .cursorrules
```

详细设计见根仓 `docs/superpowers/specs/2026-06-28-harness-doc-architecture-design.md`。
