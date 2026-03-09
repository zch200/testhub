# Agent 对接方案调研结论

> 调研日期: 2026-03-08
> 状态: 待实施（等其他功能分支合并后开始）

## 背景

TestHub 是 API 优先的产品，核心用户场景之一是让外部 Agent（如 Claude Code、Cursor 等编码助手）便捷地调用 API 来创建用例和管理测试计划。需要解决：**如何让外部 Agent 快速理解并正确使用我们的 API？**

## 候选方案

| 方案 | 说明 | 优点 | 缺点 |
|------|------|------|------|
| A. 纯 OpenAPI Spec | 提供 JSON/YAML 格式的 OpenAPI 规范 | 已有（/api/docs/json）、自动生成、零维护 | 太冗长、缺乏工作流指导、Agent 不知调用顺序 |
| B. 纯 SKILL.md | 面向 Agent 的 Markdown 指南 | Agent 友好、包含工作流和最佳实践 | 手动维护、可能与 API 不同步 |
| C. MCP Server | 把 API 包装成 MCP tools | Agent 原生调用、零学习成本 | 只适配 MCP 客户端、额外维护成本、42 端点全暴露太臃肿 |
| **D. SKILL.md + OpenAPI（推荐）** | SKILL.md 做工作流引导，OpenAPI 做详细参考 | 互补、维护成本可控、覆盖面最广 | 需编写 SKILL.md |

## 选定方案：D — SKILL.md + OpenAPI 混合

### 为什么选 D

1. **互补性强**：SKILL.md 解决"怎么用"（工作流、场景、最佳实践），OpenAPI 解决"有什么"（完整端点参考）
2. **维护成本可控**：SKILL.md 只写工作流和核心概念（相对稳定），端点参数由 Swagger 自动生成
3. **覆盖面最广**：
   - Claude Code / Cursor → 加载 SKILL.md
   - 任何 AI Agent → 读 SKILL.md + 调 API
   - 传统脚本 → 用 OpenAPI spec 生成 client
   - 人类开发者 → 看 Swagger UI
4. **符合产品定位**：用户的 Agent 大概率是编码助手，最擅长读 Markdown 然后写代码调 API
5. **渐进式扩展**：未来可追加 MCP Server 作为补充，不冲突

### 参考案例

- **mem9 SKILL.md**（~2400 字）：角色化设计 + 5 步流程 + API 示例 + 术语规范。偏向客服/助手型 Agent
- **moltbook skill.md**（~2000+ 行）：教程式，几乎重写了整个 API 文档。过于冗长

### SKILL.md 设计要点

1. **控制篇幅**：300 行以内，避免占用过多 Agent context window
2. **开头放概念模型**：数据层级关系图（Project → Library → Directory/Case → Plan），让 Agent 一眼理解结构
3. **核心放工作流**：3-5 个端到端场景，含完整 curl 示例
   - 快速开始：创建项目 → 创建库 → 创建用例
   - 批量导入用例（Agent 最常用场景）
   - 创建测试计划并执行
   - 查询用例和筛选
   - 更新执行结果
4. **结尾放参考信息**：认证方式、OpenAPI 地址（`/api/docs/json`）、注意事项
5. **不做角色化设计**：不需要 mem9 那种"你应该对用户说什么"，我们的场景是 Agent 调 API
6. **文件位置**：根目录 `SKILL.md` 或 `docs/SKILL.md`，方便通过 URL 访问

### 待定事项

- [ ] SKILL.md 的最终文件位置（根目录 vs docs/）
- [ ] 是否需要提供一个 `/skill.md` 的 HTTP 端点直接返回文件内容
- [ ] 是否同时提供 OpenAPI spec 的静态导出文件（除了动态的 /api/docs/json）
