# TestHub

一个 **单机、本地优先（local-first）** 的轻量测试管理工具。
目标是替代云效测试管理在个人/独立开发场景下的核心能力，尤其是补齐“可自动化调用 API”这一能力。

## 为什么做这个项目

很多团队已经可以让 AI 根据需求文档自动生成测试用例和测试计划，但在落地到测试平台时，经常卡在“平台 API 不开放完整能力”。

TestHub 的定位是：

- 提供完整本地 REST API，方便 coding agent / 脚本自动写入数据
- 提供可用 Web UI，专注执行测试与标记结果
- 本地 SQLite 存储，无云依赖、无协作权限复杂度

## 核心能力

- 项目 / 用例库 / 目录 / 用例 / 标签 / 测试计划管理
- 计划内用例执行（`pending/passed/failed/blocked/skipped`）
- 用例版本化（`case_versions`）
- 计划用例状态历史流水（`plan_case_status_histories`）
  - 记录状态变化前后、版本变化前后、原因、操作人、时间
- 用例更新时，自动同步到开放计划（`draft/in_progress`）并重置为 `pending`
- 关闭计划（`completed/archived`）冻结，不再自动同步

## 技术栈

- Monorepo: `pnpm` + `Turborepo`
- Backend: `Fastify` + `TypeScript` + `Drizzle ORM` + `better-sqlite3` + `Zod`
- Frontend: `React` + `Vite` + `TanStack Query` + `React Router`
- Shared: `packages/shared` 统一 schema 和类型

## 快速开始

### 1) 环境要求

- Node.js 20+
- pnpm 10+

建议开启 Corepack：

```bash
corepack enable
```

### 2) 安装依赖

```bash
pnpm install
```

> 首次安装后如遇到 `better-sqlite3` 原生模块错误，见下文“常见问题”。
> 如果 pnpm 提示忽略 build scripts，可执行 `pnpm approve-builds` 并批准 `better-sqlite3`、`esbuild`。

### 3) 启动开发模式（推荐日常使用）

```bash
pnpm dev
```

默认：

- Web（Vite）: `http://127.0.0.1:5173`
- API（Fastify）: `http://127.0.0.1:4010`
- Swagger: `http://127.0.0.1:4010/api/docs`

### 4) 构建 + 单进程启动

```bash
pnpm build
pnpm start
```

说明：

- `pnpm build` 会把前端产物复制到 `apps/server/public`
- `pnpm start` 启动单进程服务（API + 静态页面）

## API 鉴权与 Token

所有 `/api/v1/*` 接口都要求请求头：

- `x-testhub-token: <token>`

可选请求头：

- `x-testhub-operator`: 操作人标识（默认 `web-user`）
- `x-testhub-source`: 来源（`api | ui | system`，默认 `api`）

Token 获取方式：

1. 服务启动日志会打印 token
2. 本地文件：`apps/server/data/api-token`
3. 也可以通过环境变量固定 token：

```bash
TESTHUB_API_TOKEN=your_token pnpm start
```

Web UI 在每次 `bootId` 变化后会弹窗，支持一键复制 token。

> 说明：当前实现中 `/api/v1/auth/*` 也在鉴权保护下，仍需携带 `x-testhub-token`。

## Agent 集成

TestHub 为 AI Agent（Claude Code、Cursor 等）提供了开箱即用的集成方案。

启动服务后，终端会输出：

```
Agent skill guide: http://127.0.0.1:4010/skill.md
API token: <TOKEN>
```

将 skill guide URL 发送给 Agent，它会获得一份包含数据模型、工作流示例和完整 curl 命令的指南，可以立即开始调用 API。

- **Skill Guide**：`http://<host>:<port>/skill.md` — 面向 Agent 的集成指南（动态注入当前地址和 token）
- **OpenAPI Spec**：`http://<host>:<port>/api/docs/json` — 完整的 OpenAPI 3.0 规范
- **Swagger UI**：`http://<host>:<port>/api/docs` — 交互式 API 浏览器

## 常用命令

| 命令 | 说明 |
|---|---|
| `pnpm dev` | 前后端开发模式（热更新） |
| `pnpm build` | 构建全部包（shared -> server/web） |
| `pnpm start` | 单进程启动服务 |
| `pnpm typecheck` | TS 类型检查 |
| `pnpm db:migrate` | 手动执行 migration |

> 服务启动时会自动执行 migration；一般无需手动执行。

## 目录结构

```text
testhub/
├── apps/
│   ├── server/        # Fastify + SQLite + Drizzle
│   └── web/           # React + Vite
├── packages/
│   └── shared/        # Zod schemas + 类型导出
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.base.json
```

## API 概览

前缀：`/api/v1`

- Projects: `/projects`
- Libraries: `/projects/:projectId/libraries`, `/libraries/:id`
- Directories: `/libraries/:libraryId/directories`, `/directories/:id`
- Cases: `/libraries/:libraryId/cases`, `/cases/:id`, `/cases/:id/versions`
- Tags: `/libraries/:libraryId/tags`, `/tags/:id`
- Plans: `/projects/:projectId/plans`, `/plans/:id`, `/plans/:id/stats`
- Plan Cases:
  - `/plans/:planId/cases`
  - `/plans/:planId/cases/by-directory`
  - `/plans/:planId/cases/:planCaseId`
  - `/plans/:planId/cases/batch-status`
  - `/plans/:planId/cases/:planCaseId/history`
  - `/plans/:planId/history`

## 历史流水规则（重点）

`plan_case_status_histories.reason_type` 目前包含：

- `plan_case_created`
- `manual_update`
- `batch_update`
- `case_version_sync`
- `system_update`

关键行为：

- 添加计划用例会写首条历史：`null -> pending`
- 手动/批量更新状态会各写一条历史
- 用例内容更新后：
  - 开放计划（`draft/in_progress`）自动同步新版本
  - 执行状态重置为 `pending`
  - 写入 `case_version_sync` 历史
- 关闭计划（`completed/archived`）不再自动同步

## 最小调用示例（curl）

```bash
# 1) 创建项目
curl -X POST http://127.0.0.1:4010/api/v1/projects \
  -H "x-testhub-token: <TOKEN>" \
  -H "content-type: application/json" \
  -d '{"name":"Demo Project"}'

# 2) 创建用例库
curl -X POST http://127.0.0.1:4010/api/v1/projects/1/libraries \
  -H "x-testhub-token: <TOKEN>" \
  -H "content-type: application/json" \
  -d '{"name":"Core","code":"CORE"}'

# 3) 创建用例
curl -X POST http://127.0.0.1:4010/api/v1/libraries/1/cases \
  -H "x-testhub-token: <TOKEN>" \
  -H "content-type: application/json" \
  -d '{"title":"登录成功","contentType":"text","textContent":"输入正确账号密码","priority":"P1","caseType":"functional","tags":["smoke"],"steps":[]}'

# 4) 创建测试计划
curl -X POST http://127.0.0.1:4010/api/v1/projects/1/plans \
  -H "x-testhub-token: <TOKEN>" \
  -H "content-type: application/json" \
  -d '{"name":"v1.0 回归","status":"in_progress"}'

# 5) 添加用例到计划
curl -X POST http://127.0.0.1:4010/api/v1/plans/1/cases \
  -H "x-testhub-token: <TOKEN>" \
  -H "content-type: application/json" \
  -d '{"caseIds":[1]}'
```

## 数据文件

- SQLite: `apps/server/data/testhub.db`
- API token: `apps/server/data/api-token`

## 常见问题

### 1) `Could not locate the bindings file`（better-sqlite3）

执行：

```bash
pnpm rebuild better-sqlite3 esbuild
```

若仍失败，进入包目录执行：

```bash
cd node_modules/.pnpm/better-sqlite3@*/node_modules/better-sqlite3
npm run install
```

### 2) `EADDRINUSE 127.0.0.1:4010`

说明端口被占用。结束占用进程后重试。

### 3) 401 `Invalid or missing x-testhub-token`

请确认：

- 请求头是否带 `x-testhub-token`
- token 与 `apps/server/data/api-token` 一致
- 或者你是否使用了环境变量 `TESTHUB_API_TOKEN`

## 开源说明

本项目基于 [MIT License](./LICENSE) 开源，欢迎 PR / Issue。

## 开发工作流

本项目采用 GitHub Flow：每个任务开独立分支，本地验证通过后合并到 `main`。

详见 [.github/CONTRIBUTING.md](.github/CONTRIBUTING.md)。

---

如果你是独立开发者，想把”AI 生成测试资产 -> 自动入库 -> 手工执行标记”链路跑通，TestHub 就是为这个场景设计的。
