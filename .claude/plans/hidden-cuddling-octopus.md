# TestHub - 本地优先测试管理工具 详细设计

## Context

云效测试管理的 API 不支持创建测试计划和向计划规划用例，导致 AI 生成的用例和测试计划无法自动化落地。需要构建一个 local-first 的轻量测试管理工具，**核心价值是提供完整的本地 API**，让 coding agent / 脚本可以自动创建用例、创建测试计划、向计划中添加用例，用户只需在 Web UI 上执行测试和标记结果。

## 技术栈

- **Monorepo**: pnpm + Turborepo
- **后端**: Fastify + TypeScript + Drizzle + better-sqlite3 + Zod + @fastify/swagger
- **前端**: React + TypeScript + Vite + Shadcn/ui + Tailwind CSS + TanStack Query + React Router v6 + Phosphor-icons
- **共享**: packages/shared 存放 Zod schemas 和 TS 类型
- **部署**: 单进程，Fastify serve API + 前端静态文件

## 项目结构

```
testhub/
├── apps/
│   ├── server/
│   │   ├── src/
│   │   │   ├── index.ts              # 入口：启动 Fastify，注册插件、路由，serve 静态文件
│   │   │   ├── app.ts                # Fastify 实例创建与配置
│   │   │   ├── db/
│   │   │   │   ├── schema.ts         # Drizzle 表定义
│   │   │   │   ├── index.ts          # DB 连接（better-sqlite3）
│   │   │   │   └── seed.ts           # 可选：开发数据填充
│   │   │   ├── routes/
│   │   │   │   ├── projects.ts
│   │   │   │   ├── libraries.ts
│   │   │   │   ├── directories.ts
│   │   │   │   ├── cases.ts
│   │   │   │   ├── plans.ts
│   │   │   │   └── plan-cases.ts
│   │   │   └── services/             # 业务逻辑层（路由调 service，service 调 db）
│   │   │       ├── project.service.ts
│   │   │       ├── library.service.ts
│   │   │       ├── directory.service.ts
│   │   │       ├── case.service.ts
│   │   │       ├── plan.service.ts
│   │   │       └── plan-case.service.ts
│   │   ├── drizzle.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── web/
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx               # 路由配置
│       │   ├── api/                  # API client（fetch wrapper + TanStack Query hooks）
│       │   │   ├── client.ts         # 基础 fetch 封装
│       │   │   ├── projects.ts
│       │   │   ├── libraries.ts
│       │   │   ├── directories.ts
│       │   │   ├── cases.ts
│       │   │   ├── plans.ts
│       │   │   └── plan-cases.ts
│       │   ├── components/
│       │   │   ├── ui/               # shadcn/ui 组件
│       │   │   ├── layout/           # 布局组件（Sidebar, Header, etc.）
│       │   │   ├── directory-tree/   # 目录树组件
│       │   │   └── case-form/        # 用例表单组件
│       │   ├── pages/
│       │   │   ├── projects/         # 项目列表 & 详情
│       │   │   ├── libraries/        # 用例库管理
│       │   │   ├── cases/            # 用例管理（核心页）
│       │   │   └── plans/            # 测试计划（核心页）
│       │   ├── hooks/                # 通用 hooks
│       │   └── lib/                  # 工具函数
│       ├── index.html
│       ├── vite.config.ts
│       ├── tailwind.config.ts
│       ├── tsconfig.json
│       └── package.json
├── packages/
│   └── shared/
│       ├── src/
│       │   ├── index.ts
│       │   ├── schemas/              # Zod schemas（前后端共享）
│       │   │   ├── project.ts
│       │   │   ├── library.ts
│       │   │   ├── directory.ts
│       │   │   ├── case.ts
│       │   │   ├── plan.ts
│       │   │   └── plan-case.ts
│       │   └── types.ts              # 从 Zod schema 推导的 TS 类型
│       ├── tsconfig.json
│       └── package.json
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── .gitignore
└── tsconfig.base.json
```

## 数据模型（Drizzle Schema）

### projects
| 列 | 类型 | 说明 |
|---|---|---|
| id | integer PK autoincrement | |
| name | text NOT NULL | 项目名称 |
| description | text | 项目描述 |
| created_at | text NOT NULL | ISO 时间戳 |
| updated_at | text NOT NULL | ISO 时间戳 |

### libraries（用例库）
| 列 | 类型 | 说明 |
|---|---|---|
| id | integer PK autoincrement | |
| project_id | integer NOT NULL FK→projects | |
| name | text NOT NULL | 用例库名称 |
| code | text NOT NULL | 4位标识码（如 CORE） |
| description | text | |
| created_at | text NOT NULL | |
| updated_at | text NOT NULL | |

UNIQUE(project_id, code)

### directories（目录/模块树）
| 列 | 类型 | 说明 |
|---|---|---|
| id | integer PK autoincrement | |
| library_id | integer NOT NULL FK→libraries | |
| parent_id | integer FK→directories | NULL=根目录 |
| name | text NOT NULL | |
| sort_order | integer NOT NULL DEFAULT 0 | |
| created_at | text NOT NULL | |
| updated_at | text NOT NULL | |

### cases（测试用例）
| 列 | 类型 | 说明 |
|---|---|---|
| id | integer PK autoincrement | |
| library_id | integer NOT NULL FK→libraries | |
| directory_id | integer FK→directories | NULL=未分类 |
| title | text NOT NULL | 用例标题 |
| precondition | text | 前置条件 |
| content_type | text NOT NULL DEFAULT 'text' | 'text' 或 'step' |
| text_content | text | 文本模式：执行描述 |
| text_expected | text | 文本模式：预期结果 |
| priority | text NOT NULL DEFAULT 'P1' | P0/P1/P2/P3 |
| case_type | text NOT NULL DEFAULT 'functional' | functional/performance/api/ui/... |
| created_at | text NOT NULL | |
| updated_at | text NOT NULL | |

### case_steps（用例步骤 - 表格模式）
| 列 | 类型 | 说明 |
|---|---|---|
| id | integer PK autoincrement | |
| case_id | integer NOT NULL FK→cases | |
| step_order | integer NOT NULL | 步骤序号 |
| action | text NOT NULL | 操作步骤 |
| expected | text | 预期结果 |

### tags（标签表）
| 列 | 类型 | 说明 |
|---|---|---|
| id | integer PK autoincrement | |
| library_id | integer NOT NULL FK→libraries | 标签归属用例库 |
| name | text NOT NULL | 标签名称 |

UNIQUE(library_id, name)

### case_tags（用例-标签关联）
| 列 | 类型 | 说明 |
|---|---|---|
| case_id | integer NOT NULL FK→cases | |
| tag_id | integer NOT NULL FK→tags | |

PK(case_id, tag_id)

### plans（测试计划）
| 列 | 类型 | 说明 |
|---|---|---|
| id | integer PK autoincrement | |
| project_id | integer NOT NULL FK→projects | |
| name | text NOT NULL | 计划名称 |
| description | text | |
| start_date | text | YYYY-MM-DD |
| end_date | text | YYYY-MM-DD |
| status | text NOT NULL DEFAULT 'draft' | draft/in_progress/completed/archived |
| created_at | text NOT NULL | |
| updated_at | text NOT NULL | |

### plan_cases（计划-用例关联 + 执行状态）
| 列 | 类型 | 说明 |
|---|---|---|
| id | integer PK autoincrement | |
| plan_id | integer NOT NULL FK→plans | |
| case_id | integer NOT NULL FK→cases | |
| execution_status | text NOT NULL DEFAULT 'pending' | pending/passed/failed/blocked/skipped |
| remark | text | 执行备注 |
| executed_at | text | 执行时间 |
| created_at | text NOT NULL | |
| updated_at | text NOT NULL | |

UNIQUE(plan_id, case_id)

## API 设计

所有 API 前缀: `/api/v1`

### Projects
| Method | Path | 说明 |
|---|---|---|
| GET | /projects | 列表 |
| POST | /projects | 创建 |
| GET | /projects/:id | 详情 |
| PUT | /projects/:id | 更新 |
| DELETE | /projects/:id | 删除（级联删除库、用例、计划） |

### Libraries
| Method | Path | 说明 |
|---|---|---|
| GET | /projects/:projectId/libraries | 列表 |
| POST | /projects/:projectId/libraries | 创建 |
| GET | /libraries/:id | 详情 |
| PUT | /libraries/:id | 更新 |
| DELETE | /libraries/:id | 删除（级联） |

### Directories
| Method | Path | 说明 |
|---|---|---|
| GET | /libraries/:libraryId/directories | 返回完整目录树 |
| POST | /libraries/:libraryId/directories | 创建目录 |
| PUT | /directories/:id | 更新（重命名、移动 parent_id） |
| DELETE | /directories/:id | 删除（子目录和用例如何处理通过参数控制） |

### Cases
| Method | Path | 说明 |
|---|---|---|
| GET | /libraries/:libraryId/cases | 列表（支持 ?directoryId=&priority=&type=&tag=&keyword= 筛选） |
| POST | /libraries/:libraryId/cases | 创建单个用例 |
| POST | /libraries/:libraryId/cases/batch | 批量创建（agent 友好） |
| GET | /cases/:id | 详情（含步骤和标签） |
| PUT | /cases/:id | 更新 |
| DELETE | /cases/:id | 删除 |

### Tags
| Method | Path | 说明 |
|---|---|---|
| GET | /libraries/:libraryId/tags | 列表 |
| POST | /libraries/:libraryId/tags | 创建 |
| DELETE | /tags/:id | 删除 |

### Plans
| Method | Path | 说明 |
|---|---|---|
| GET | /projects/:projectId/plans | 列表 |
| POST | /projects/:projectId/plans | 创建 |
| GET | /plans/:id | 详情（含统计摘要） |
| PUT | /plans/:id | 更新 |
| DELETE | /plans/:id | 删除 |

### Plan Cases（计划中的用例）
| Method | Path | 说明 |
|---|---|---|
| GET | /plans/:planId/cases | 列表（含执行状态，支持 ?status= 筛选） |
| POST | /plans/:planId/cases | 添加用例到计划（body: { caseIds: number[] }）|
| POST | /plans/:planId/cases/by-directory | 按目录批量添加（body: { directoryId, recursive? }）|
| PUT | /plans/:planId/cases/:planCaseId | 更新执行状态和备注 |
| DELETE | /plans/:planId/cases/:planCaseId | 从计划移除 |
| POST | /plans/:planId/cases/batch-status | 批量更新状态 |
| GET | /plans/:planId/stats | 统计（各状态数量和占比） |

## 前端页面

### 路由结构
```
/                              → 重定向到 /projects
/projects                      → 项目列表页
/projects/:projectId           → 项目详情（包含用例库列表 + 测试计划入口）
/projects/:projectId/libraries/:libraryId
                               → 用例管理页（左侧目录树 + 右侧用例列表）
/projects/:projectId/plans     → 测试计划列表页
/projects/:projectId/plans/:planId
                               → 测试计划详情页（用例列表 + 执行 + 统计）
```

### 核心页面说明

**用例管理页**（最复杂的页面）：
- 布局：左侧 ~250px 目录树面板 + 右侧用例列表
- 目录树：支持展开/折叠、拖拽排序（可后续做）、右键菜单（新建子目录、重命名、删除）
- 用例列表：DataTable（TanStack Table），列 = 标题 | 优先级 | 类型 | 标签 | 更新时间
- 点击用例：右侧弹出 Sheet/Drawer 显示详情，可编辑
- 筛选栏：优先级、类型、标签、关键词搜索

**测试计划详情页**：
- 顶部：计划基本信息（名称、时间范围、状态）+ 进度统计条
- 用例列表：DataTable，列 = 标题 | 优先级 | 执行状态 | 备注 | 操作
- 执行状态可在行内直接通过下拉切换（快速执行）
- 操作栏："添加用例"按钮 → 弹窗选择用例库和目录

## MVP 实施步骤

### Step 1: Monorepo 脚手架搭建
- 初始化 pnpm workspace + Turborepo
- 创建 apps/server, apps/web, packages/shared 三个包
- 配置 TypeScript（tsconfig.base.json + 各包继承）
- 配置 turbo.json（dev/build/lint pipeline）
- .gitignore, git init

### Step 2: Shared 包 - Zod Schemas
- 定义所有实体的 Zod schema（create/update/response）
- 导出推导的 TypeScript 类型
- 定义枚举常量（priority, case_type, execution_status, plan_status）

### Step 3: 后端 - 数据库 & 基础设施
- 安装依赖（fastify, drizzle-orm, better-sqlite3, @fastify/swagger 等）
- 定义 Drizzle schema（apps/server/src/db/schema.ts）
- 配置 drizzle-kit，生成初始 migration
- 创建 DB 连接模块
- 配置 Fastify 实例（CORS, Swagger, 错误处理）

### Step 4: 后端 - API 路由（核心）
按以下顺序实现（每个 route 文件包含路由 + service 逻辑）：
1. projects CRUD
2. libraries CRUD
3. directories CRUD + 树形查询
4. cases CRUD + 批量创建 + 筛选
5. tags CRUD + case-tag 关联
6. plans CRUD
7. plan-cases：添加/移除/更新状态/统计

### Step 5: 前端 - 基础设施
- Vite + React + TypeScript 项目初始化
- 安装配置 Tailwind CSS + shadcn/ui
- 安装 Phosphor-icons, TanStack Query, React Router, Zod
- 创建布局组件（AppLayout with sidebar）
- 配置路由
- 封装 API client

### Step 6: 前端 - 页面实现
1. 项目列表页（简单 CRUD）
2. 项目详情页（用例库列表 + 测试计划入口）
3. 用例管理页（目录树 + 用例列表 + 用例详情 Sheet）
4. 测试计划列表页
5. 测试计划详情页（用例列表 + 执行状态 + 统计）

### Step 7: 生产构建 & 集成
- Vite 构建前端到 apps/server/public/
- Fastify 配置 @fastify/static serve 前端产物
- 统一启动脚本：`pnpm start` 启动单进程
- Turborepo 配置 build pipeline 依赖关系

## 验证方式

1. `pnpm dev` 启动开发模式（前后端热重载），浏览器访问 Web UI 完整操作一遍
2. 访问 `/api/docs`（Swagger UI），手动测试所有 API 端点
3. 模拟 agent 工作流：通过 curl 或脚本调用 API 完成"创建项目 → 创建用例库 → 批量创建用例 → 创建测试计划 → 向计划添加用例"全流程
4. 在 Web UI 上执行测试计划：逐条标记用例状态，验证统计数据正确
5. `pnpm build && pnpm start` 验证生产模式单进程启动正常
