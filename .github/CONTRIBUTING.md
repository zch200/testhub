# 开发工作流

本项目采用 **GitHub Flow** 进行版本管理，适合单人开发与 AI coding 协作场景。

## 核心原则

- `main` 分支始终保持可运行状态，不直接在 main 上开发
- 每个功能 / 修复 / AI coding 任务，开一个独立的短生命周期分支
- 本地跑通后再合并到 main

## 分支命名

| 类型 | 前缀 | 示例 |
|---|---|---|
| 新功能 | `feat/` | `feat/plan-statistics` |
| Bug 修复 | `fix/` | `fix/case-delete-cascade` |
| 重构 | `refactor/` | `refactor/query-hooks` |
| 文档 | `docs/` | `docs/api-examples` |

## 标准流程

```bash
# 1. 从最新 main 开出任务分支
git checkout main && git pull
git checkout -b feat/xxx

# 2. 开发 & 本地验证
pnpm dev         # 开发模式
pnpm typecheck   # 类型检查（必须通过）
pnpm build       # 构建验证（必须通过）

# 3. 提交
git add <相关文件>
git commit -m "feat: ..."

# 4. 合并回 main
git checkout main
git merge feat/xxx --no-ff   # --no-ff 保留合并节点，便于追溯
git push origin main

# 5. 删除本地任务分支
git branch -d feat/xxx
```

## AI Coding 场景

每次让 AI 负责一个任务时，提前开好对应分支。
如果 AI 把代码搞崩了：

```bash
# 方案 A：丢弃当前分支，重新来
git checkout main
git branch -D feat/xxx   # 强制删除

# 方案 B：回退到某个干净的提交
git reset --hard <commit-hash>
```

`main` 始终不受影响。

## 合并前检查清单

- [ ] `pnpm typecheck` 无报错
- [ ] `pnpm build` 成功
- [ ] 本地启动 `pnpm dev` 或 `pnpm start`，核心流程可用
- [ ] 数据库 migration 已生成（如有 schema 变更：`pnpm db:generate`）

## commit message 格式

遵循 [Conventional Commits](https://www.conventionalcommits.org/)：

```
feat: 添加测试计划统计接口
fix: 修复删除项目时未级联删除计划
refactor: 拆分 plan-cases 路由
docs: 补充 curl 调用示例
chore: 升级 drizzle-orm
```
