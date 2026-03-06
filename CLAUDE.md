# TestHub - 本地优先测试管理工具

## 项目概述

替代云效测试管理的 local-first 轻量工具。核心价值：提供完整的本地 REST API，让 coding agent / 脚本自动创建用例和测试计划，用户通过 Web UI 执行测试和标记结果。

## 技术栈

- **Monorepo**: pnpm + Turborepo
- **后端** (`apps/server`): Fastify + TypeScript + Drizzle ORM + better-sqlite3 + Zod + @fastify/swagger
- **前端** (`apps/web`): React + TypeScript + Vite + Shadcn/ui + Tailwind CSS + TanStack Query + React Router v6 + Phosphor-icons
- **共享** (`packages/shared`): Zod schemas + 从 schema 推导的 TypeScript 类型
- **部署**: 单进程 — Fastify 同时 serve REST API 和前端静态文件

## 项目结构

```
testhub/
├── apps/
│   ├── server/                    # Fastify 后端
│   │   └── src/
│   │       ├── index.ts           # 入口
│   │       ├── app.ts             # Fastify 实例与插件配置
│   │       ├── db/                # Drizzle schema + DB 连接
│   │       ├── routes/            # API 路由（每个资源一个文件）
│   │       └── services/          # 业务逻辑层
│   └── web/                       # React 前端
│       └── src/
│           ├── api/               # fetch 封装 + TanStack Query hooks
│           ├── components/        # UI 组件（含 shadcn/ui）
│           ├── pages/             # 页面组件
│           ├── hooks/             # 通用 hooks
│           └── lib/               # 工具函数
├── packages/
│   └── shared/                    # 前后端共享
│       └── src/
│           ├── schemas/           # Zod schemas（每个实体一个文件）
│           └── types.ts           # z.infer 推导的类型
├── turbo.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## 常用命令

```bash
pnpm install              # 安装所有依赖
pnpm dev                  # 启动开发模式（前后端热重载）
pnpm build                # 构建所有包（shared → server/web）
pnpm start                # 生产模式启动（单进程）
pnpm db:generate          # 生成 Drizzle migration
pnpm db:migrate           # 执行 migration
pnpm test                 # 运行所有测试
pnpm test:watch           # 监听模式运行测试
```

## 数据模型

9 张表，层级关系：Project → Library → Directory(树) / Case / Tag，Plan → PlanCase。

| 表 | 说明 | 关键字段 |
|---|---|---|
| projects | 顶层项目 | name, description |
| libraries | 用例库 | project_id, name, code(4位标识) |
| directories | 目录树 | library_id, parent_id(NULL=根), sort_order |
| cases | 测试用例 | library_id, directory_id, title, precondition, content_type(text/step), priority(P0-P3), case_type |
| case_steps | 用例步骤（表格模式） | case_id, step_order, action, expected |
| tags | 标签 | library_id, name; UNIQUE(library_id, name) |
| case_tags | 用例-标签关联 | case_id, tag_id |
| plans | 测试计划 | project_id, name, start_date, end_date, status(draft/in_progress/completed/archived) |
| plan_cases | 计划中的用例执行 | plan_id, case_id, execution_status(pending/passed/failed/blocked/skipped), remark, executed_at |

- 所有表使用 integer PK autoincrement
- 时间戳统一用 text 存 ISO 8601 格式
- SQLite 数据文件位于 `apps/server/data/testhub.db`

## API 规范

- 前缀: `/api/v1`
- Swagger UI: `/api/docs`
- 请求/响应: JSON，使用 Zod schema 校验
- 路由风格: RESTful，嵌套资源用父级路径（如 `/projects/:projectId/libraries`），独立操作用顶级路径（如 `/cases/:id`）
- 批量操作: `POST .../batch`（如 `/libraries/:libraryId/cases/batch` 批量创建用例）

主要端点:
- Projects: CRUD `/projects`
- Libraries: CRUD `/projects/:projectId/libraries`, `/libraries/:id`
- Directories: CRUD `/libraries/:libraryId/directories`, `/directories/:id`（返回树形结构）
- Cases: CRUD + batch + 筛选 `/libraries/:libraryId/cases`, `/cases/:id`
- Tags: `/libraries/:libraryId/tags`, `/tags/:id`
- Plans: CRUD `/projects/:projectId/plans`, `/plans/:id`
- Plan Cases: `/plans/:planId/cases`（添加/移除/状态更新/统计）

## 前端路由

```
/projects                                      项目列表
/projects/:projectId                           项目详情（用例库 + 计划入口）
/projects/:projectId/libraries/:libraryId      用例管理（目录树 + 用例列表）
/projects/:projectId/plans                     测试计划列表
/projects/:projectId/plans/:planId             测试计划详情（执行 + 统计）
```

## 编码规范

### 通用
- 语言: TypeScript strict mode，不使用 any
- Schema: 前后端共享 Zod schema（packages/shared），从 schema 推导类型，禁止手写重复类型
- 命名: 文件名 kebab-case，变量/函数 camelCase，类型/接口 PascalCase，数据库列 snake_case
- 不需要协作功能（无负责人、权限、公开/私密概念）

### 后端
- 路由文件只做参数解析和响应，业务逻辑放 services/
- 所有路由注册 Zod schema 用于 Swagger 文档生成
- 错误处理统一返回 `{ error: string }` 格式
- 删除操作做级联删除（如删除项目时级联删除其下所有库、用例、计划）

### 前端
- 数据请求统一通过 TanStack Query hooks，不直接 fetch
- API client 封装在 `src/api/client.ts`，各资源的 query/mutation hooks 按资源分文件
- UI 组件优先使用 shadcn/ui，图标使用 Phosphor-icons
- 表单校验复用 packages/shared 的 Zod schema
- 页面组件放 `src/pages/`，可复用组件放 `src/components/`

## 分支与版本管理

本项目采用 **GitHub Flow**：`main` 始终保持可运行，每个任务开独立短生命周期分支，本地验证通过后合并回 main。

**分支命名前缀**：`feat/` | `fix/` | `refactor/` | `docs/` | `chore/`

**每次任务开始前必须先建分支**：
```bash
git checkout main && git pull
git checkout -b feat/xxx   # 或 fix/xxx 等
```

**合并前必须通过**：`pnpm typecheck` + `pnpm build`

完整流程见 `.github/CONTRIBUTING.md`。

## 设计参考

详细的数据模型、API 设计和实施步骤见 `.claude/plans/hidden-cuddling-octopus.md`。
