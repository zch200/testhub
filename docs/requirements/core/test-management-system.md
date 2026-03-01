# TestHub - 本地优先测试管理系统

---

## 元信息

- **所属系统**：TestHub
- **所属模块**：核心功能（Core）
- **创建时间**：2026-02-09
- **最后更新**：2026-02-09
- **当前版本**：v1.0.0
- **状态**：开发中
- **负责人**：-

---

## 变更历史

| 日期 | 版本 | 变更类型 | 变更内容 | 影响文件 | 变更人 |
|------|------|----------|----------|----------|--------|
| 2026-02-09 | v1.0.0 | 新增 | 初始版本，包含项目管理、用例库管理、测试用例管理、测试计划管理四大核心功能 | 全部 | - |

**变更类型说明：**
- 新增：新功能
- 优化：改进现有功能
- 修复：Bug 修复
- 重构：代码重构（不改变功能）
- 废弃：功能下线

---

## 业务背景

云效测试管理的 API 不支持创建测试计划和向测试计划规划用例，导致 AI 生成的测试用例和测试计划无法自动化同步到云效系统。这个限制打断了"需求文档 → AI 生成用例 → 自动同步到测试管理工具 → 人工执行测试"的工作流。

为解决这个问题，需要构建一个 **local-first** 的轻量测试管理工具，核心价值是：
1. 提供完整的本地 REST API，让 coding agent / 脚本可以自动创建用例、创建测试计划、向计划中添加用例
2. 提供 Web UI 供人工查看数据、执行测试、标记测试结果
3. 数据本地存储（SQLite），单机使用，无需部署复杂的服务器环境

---

## 功能描述

### 1. 项目管理

**功能概述：**
项目是 TestHub 的顶层容器，一个项目下可以包含多个用例库和测试计划。

**操作流程：**
- 用户可以创建项目，填写项目名称和描述
- 在项目列表页查看所有项目
- 点击项目进入项目详情页，查看该项目下的用例库和测试计划
- 可以编辑项目信息或删除项目（级联删除其下所有用例库、用例、测试计划，需要弹窗让用户确认）

**API 支持：**
- `GET /api/v1/projects` - 获取项目列表
- `POST /api/v1/projects` - 创建项目
- `GET /api/v1/projects/:id` - 获取项目详情
- `PUT /api/v1/projects/:id` - 更新项目
- `DELETE /api/v1/projects/:id` - 删除项目（级联删除）

### 2. 用例库管理

**功能概述：**
用例库归属于项目，用于组织和管理测试用例。每个用例库有独立的目录树结构和标签体系。

**操作流程：**
- 在项目详情页创建用例库，填写库名称、4 位标识码（如 CORE）、描述
- 查看项目下的所有用例库列表
- 点击用例库进入用例管理页（包含目录树和用例列表）
- 可以编辑用例库信息或删除用例库（级联删除其下所有目录、用例、标签）

**字段说明：**
- **库名称**：用例库的显示名称
- **库标识码**：4 位大写英文字母或数字标识（正则 `^[A-Z0-9]{4}$`，如 CORE、AUTH），同一项目下唯一
- **描述**：可选，说明用例库的用途

**API 支持：**
- `GET /api/v1/projects/:projectId/libraries` - 获取用例库列表
- `POST /api/v1/projects/:projectId/libraries` - 创建用例库
- `GET /api/v1/libraries/:id` - 获取用例库详情
- `PUT /api/v1/libraries/:id` - 更新用例库
- `DELETE /api/v1/libraries/:id` - 删除用例库（级联删除）

### 3. 目录管理

**功能概述：**
用例库内的树形目录结构，用于分类组织测试用例。

**操作流程：**
- 在用例管理页的左侧目录树中创建目录
- 支持多层级嵌套（parent_id 为空表示根目录）
- 可以重命名目录、移动目录（修改 parent_id）
- 删除目录时通过 `caseMoveTo` 参数控制用例处理方式：`uncategorized`（默认，用例变为未分类）或 `parent`（用例移动到父目录）；子目录的 parent_id 自动置空变为根级

**API 支持：**
- `GET /api/v1/libraries/:libraryId/directories` - 获取目录树（树形结构）
- `POST /api/v1/libraries/:libraryId/directories` - 创建目录
- `GET /api/v1/directories/:id` - 获取目录详情
- `PUT /api/v1/directories/:id` - 更新目录（重命名、移动）
- `DELETE /api/v1/directories/:id?caseMoveTo=uncategorized|parent` - 删除目录

### 4. 测试用例管理

**功能概述：**
测试用例是测试管理的核心单元，包含用例标题、前置条件、执行步骤、预期结果、优先级、类型、标签等信息。

**用例字段：**
- **标题**（必填）：用例的简要描述
- **前置条件**（可选）：执行用例前需要满足的条件
- **内容类型**：文本模式（text）或步骤模式（step）
  - 文本模式：包含"执行描述"（textContent）和"预期结果"（textExpected）两个文本框
  - 步骤模式：表格形式，每行包含步骤序号、操作步骤、预期结果
- **优先级**：P0（最高）、P1、P2、P3（最低）
- **用例类型**：功能测试（functional）、性能测试（performance）、API 测试（api）、UI 测试（ui）、其他（other）
- **标签**：可以给用例打多个标签，用于筛选和分类

**操作流程：**

#### 4.1 创建用例（单个）
- 在用例管理页点击"新建用例"按钮
- 在表单中填写用例字段
- 选择所属目录（可选，不选则为"未分类"）
- 选择内容类型：
  - 如果是文本模式，填写执行描述和预期结果
  - 如果是步骤模式，在表格中添加步骤行
- 添加标签（支持选择已有标签或创建新标签）
- 保存用例

#### 4.2 批量创建用例（API）
- Agent / 脚本调用批量创建接口
- 请求体包含多个用例对象数组
- 系统自动创建用例并关联标签

#### 4.3 查看和编辑用例
- 在用例列表中点击用例行，右侧弹出 Sheet/Drawer 显示用例详情
- 可以直接在详情页编辑用例字段
- 保存后更新用例

#### 4.4 筛选和搜索用例
- 按目录筛选：点击左侧目录树的目录节点，右侧列表只显示该目录下的用例
- 按优先级筛选：下拉选择 P0/P1/P2/P3
- 按类型筛选：下拉选择功能测试、性能测试等
- 按标签筛选：选择一个或多个标签
- 关键词搜索：在用例标题中搜索

#### 4.5 删除用例
- 在用例详情页点击"删除"按钮
- 确认后删除用例（同时删除关联的标签关系和步骤）

**API 支持：**
- `GET /api/v1/libraries/:libraryId/cases` - 获取用例列表（支持筛选参数：directoryId、priority、type、tag、keyword；支持分页和排序）
- `POST /api/v1/libraries/:libraryId/cases` - 创建单个用例（自动创建版本快照）
- `POST /api/v1/libraries/:libraryId/cases/batch` - 批量创建用例（每个用例自动创建版本快照）
- `GET /api/v1/cases/:id` - 获取用例详情（含步骤和标签）
- `PUT /api/v1/cases/:id` - 更新用例（自动递增版本号并创建新版本快照）
- `DELETE /api/v1/cases/:id` - 删除用例
- `GET /api/v1/cases/:id/versions` - 获取用例版本历史列表
- `GET /api/v1/cases/:id/versions/:versionNo` - 获取指定版本详情

### 5. 标签管理

**功能概述：**
标签归属于用例库，用于灵活分类用例。每个标签在同一用例库内名称唯一。

**操作流程：**
- 创建用例时可以创建新标签
- 在标签管理页查看用例库下的所有标签
- 可以删除标签（会同时删除所有用例-标签关联关系）

**API 支持：**
- `GET /api/v1/libraries/:libraryId/tags` - 获取标签列表
- `POST /api/v1/libraries/:libraryId/tags` - 创建标签
- `DELETE /api/v1/tags/:id` - 删除标签

### 6. 测试计划管理

**功能概述：**
测试计划用于组织一次测试活动，从用例库中选择用例纳入计划，并跟踪每个用例的执行状态。

**计划字段：**
- **计划名称**（必填）：测试计划的名称
- **描述**（可选）：计划的详细说明
- **时间范围**：开始日期和结束日期（可选）
- **状态**：草稿（draft）、进行中（in_progress）、已完成（completed）、已归档（archived）

**操作流程：**

#### 6.1 创建测试计划
- 在项目详情页或测试计划列表页点击"新建计划"
- 填写计划名称、描述、时间范围
- 保存计划（初始状态为"草稿"）

#### 6.2 向计划中添加用例
有两种方式：

**方式 1：按用例 ID 添加**
- 在计划详情页点击"添加用例"按钮
- 弹窗中选择用例库
- 显示该用例库下的用例列表（支持筛选）
- 勾选要添加的用例
- 确认后将用例添加到计划中

**方式 2：按目录批量添加**
- 在计划详情页点击"按目录添加"
- 选择用例库和目录
- 选择是否递归添加子目录下的用例
- 确认后将目录下的所有用例添加到计划中

**API 支持：**
- `POST /api/v1/plans/:planId/cases` - 添加用例到计划（请求体：{ caseIds: number[] }）
- `POST /api/v1/plans/:planId/cases/by-directory` - 按目录批量添加（请求体：{ directoryId: number, recursive?: boolean }）

#### 6.3 执行测试和标记状态

**执行状态：**
- 待执行（pending）
- 通过（passed）
- 失败（failed）
- 阻塞（blocked）
- 跳过（skipped）

**快速执行：**
- 在计划详情页的用例列表中，每行有一个执行状态下拉框
- 直接选择状态即可更新（如选择"通过"）
- 可以添加执行备注

**详细执行：**
- 点击用例行，展开详情
- 查看用例的完整信息（前置条件、步骤、预期结果）
- 按照用例描述执行测试
- 标记执行状态并填写备注（如失败原因、截图链接等）
- 可附带原因备注（reasonNote），记录本次状态变更的原因，该信息会写入状态变更历史

**批量更新状态：**
- 勾选多个用例
- 点击"批量标记"按钮
- 选择统一的状态（如"通过"）
- 确认后批量更新

**API 支持：**
- `GET /api/v1/plans/:planId/cases` - 获取计划中的用例列表（支持按状态筛选、分页排序）
- `PUT /api/v1/plans/:planId/cases/:planCaseId` - 更新执行状态、备注和原因备注
- `POST /api/v1/plans/:planId/cases/batch-status` - 批量更新状态（支持 reasonNote）
- `DELETE /api/v1/plans/:planId/cases/:planCaseId` - 从计划中移除用例
- `GET /api/v1/plans/:planId/cases/:planCaseId/history` - 获取单个用例的状态变更历史
- `GET /api/v1/plans/:planId/history` - 获取计划级状态变更时间线

#### 6.4 查看计划统计

**统计指标：**
- 总用例数
- 各状态用例数（待执行、通过、失败、阻塞、跳过）
- 各状态占比（百分比）
- 通过率（通过数 / 总数）

**展示方式：**
- 在计划详情页顶部显示进度统计条（类似进度条，不同颜色代表不同状态）
- 显示文字统计信息

**API 支持：**
- `GET /api/v1/plans/:planId/stats` - 获取计划统计数据

#### 6.5 编辑和删除计划
- 在计划详情页可以编辑计划名称、描述、时间范围、状态
- 可以删除计划（会级联删除计划中的用例执行记录）

**API 支持：**
- `GET /api/v1/projects/:projectId/plans` - 获取测试计划列表
- `POST /api/v1/projects/:projectId/plans` - 创建测试计划
- `GET /api/v1/plans/:id` - 获取计划详情（含统计摘要）
- `PUT /api/v1/plans/:id` - 更新计划
- `DELETE /api/v1/plans/:id` - 删除计划

### 7. API Token 认证

**功能概述：**
为保护 API 接口安全，系统使用静态 Token 认证机制。所有 `/api/v1/*` 路由需在请求头中携带有效的 API Token。

**Token 生命周期：**
- 系统首次启动时自动生成一个随机 Token（48 位 hex），并持久化存储到 `apps/server/data/api-token` 文件
- 也可以通过环境变量 `TESTHUB_API_TOKEN` 预设 Token（优先级高于文件）
- 支持通过 API 轮换 Token

**认证方式：**
- 请求头：`x-testhub-token: <token>`
- 认证失败返回 `401 Invalid or missing x-testhub-token`

**操作者与来源追踪：**
- `x-testhub-operator` 请求头：标识操作者（默认 "web-user"），用于状态变更历史中的 actor 字段
- `x-testhub-source` 请求头：标识来源（"api" | "ui" | "system"），用于状态变更历史中的 source 字段

**前端集成：**
- 服务端提供 `/runtime-config.js` 端点，以 JavaScript 变量形式下发 apiBase、apiToken、bootId
- 前端 API Client 自动从 runtime config 读取 Token 并附加到所有请求头中
- 提供 TokenModal 组件，用于展示和复制 API Token（便于用户在脚本和 agent 中使用）

**API 支持：**
- `GET /api/v1/auth/token` - 获取当前 Token
- `POST /api/v1/auth/rotate-token` - 轮换 Token（生成新 Token 并替换旧 Token）

### 8. 用例版本管理

**功能概述：**
测试用例支持版本追踪。每次创建或修改用例时，系统自动保存一个版本快照到 `case_versions` 表。用例加入测试计划时会绑定当时的版本号，确保计划执行时用例内容可追溯。

**版本机制：**
- `cases` 表的 `latest_version_no` 字段记录当前最新版本号（从 1 开始递增）
- 每次创建/更新用例后，系统自动创建一条 `case_versions` 记录，包含该时刻的完整用例数据快照
- 版本快照包含：title、precondition、contentType、textContent、textExpected、priority、caseType、stepsJson（步骤序列化 JSON）、tagsJson（标签序列化 JSON）

**与测试计划的关联：**
- 用例加入计划时，`plan_cases.case_version_id` 记录当时的版本 ID
- 计划用例列表中显示版本号（如 "v1"、"v2"）
- 通过版本绑定，即使后续用例被修改，计划中的执行参照仍可追溯到加入时的用例内容

**操作流程：**
- 在用例详情中可以查看版本历史列表
- 可以查看某个特定版本的完整用例内容

**API 支持：**
- `GET /api/v1/cases/:id/versions` - 获取用例版本历史列表（分页）
- `GET /api/v1/cases/:id/versions/:versionNo` - 获取指定版本的用例内容

### 9. 计划用例状态变更历史

**功能概述：**
记录测试计划中每个用例的状态变更轨迹，形成完整的执行历史时间线。每次状态变更、批量更新、用例加入计划等操作都会生成一条历史记录。

**历史记录字段：**
- **from/to 执行状态**：状态变更前后的值（首次记录时 from 为 null）
- **from/to 版本 ID**：关联的用例版本变更
- **原因类型**（reason_type）：manual_update（手动更新）、batch_update（批量更新）、case_version_sync（版本同步）、plan_case_created（用例加入计划）、system_update（系统更新）
- **原因备注**（reason_note）：可选的文字说明
- **操作者**（actor）：执行操作的人（来自 `x-testhub-operator` 请求头）
- **来源**（source）：api / ui / system（来自 `x-testhub-source` 请求头）

**操作流程：**
- 在测试计划详情页底部显示"Plan Timeline"（计划级时间线），展示该计划下所有用例的状态变更记录
- 每条计划用例可点击"History"按钮，在侧边抽屉中查看该用例的完整状态变更历史
- 状态更新时可附带 reasonNote（原因备注），会被记录到历史中

**API 支持：**
- `GET /api/v1/plans/:planId/cases/:planCaseId/history` - 获取单个计划用例的状态变更历史（分页）
- `GET /api/v1/plans/:planId/history` - 获取整个计划的状态变更时间线（分页）

---

## 用户故事

- 作为 **测试工程师**，我想要通过 API 批量创建测试用例，以便让 AI 自动生成的用例快速落地到测试管理工具
- 作为 **测试工程师**，我想要通过 API 创建测试计划并自动添加用例，以便节省手动规划测试计划的时间
- 作为 **测试执行人员**，我想要在 Web UI 上查看测试计划中的用例列表，以便逐条执行测试并标记结果
- 作为 **测试管理者**，我想要查看测试计划的统计数据，以便了解测试进度和质量情况
- 作为 **开发人员**，我想要本地存储测试数据，以便无需依赖云服务即可使用测试管理工具
- 作为 **测试工程师**，我想要通过 API Token 认证保护接口，以便防止未授权的访问
- 作为 **测试工程师**，我想要查看用例的版本历史，以便追溯用例的修改记录
- 作为 **测试管理者**，我想要查看计划中每个用例的状态变更历史，以便了解测试执行的完整过程

---

## 技术实现

> 简要说明实现要点，详细设计见代码注释和 CLAUDE.md

### 前端

- **技术栈**：React + TypeScript + Vite + Shadcn/ui + Tailwind CSS + TanStack Query + React Router v6 + Phosphor-icons
- **路由**：
  - `/projects` - 项目列表
  - `/projects/:projectId` - 项目详情（用例库列表 + 测试计划入口）
  - `/projects/:projectId/libraries/:libraryId` - 用例管理页（目录树 + 用例列表）
  - `/projects/:projectId/plans` - 测试计划列表
  - `/projects/:projectId/plans/:planId` - 测试计划详情（用例列表 + 执行 + 统计）
- **主要组件**：
  - `LayoutShell` - 应用外壳布局（侧边栏导航 + 主内容区）
  - `DirectoryTree` - 目录树组件（支持展开/折叠、右键菜单）
  - `CaseTable` - 用例列表表格（TanStack Table）
  - `CaseDetailSheet` - 用例详情侧边栏
  - `PlanStatsBar` - 测试计划统计条
  - `CaseForm` - 用例表单组件
  - `TokenModal` - API Token 展示和复制弹窗
- **状态管理**：使用 TanStack Query 管理服务端状态，自动缓存和重验证
- **Runtime Config**：服务端通过 `/runtime-config.js` 注入配置（apiBase、apiToken、bootId），前端在运行时读取
- **关键交互**：
  - 用例列表点击行展开详情
  - 目录树点击节点筛选用例
  - 测试计划中行内下拉切换执行状态
  - 批量选择用例进行批量操作
  - 计划用例支持查看状态变更历史（抽屉组件）
  - 计划详情页展示完整状态变更时间线
  - 用例列表显示版本号

### 后端

- **技术栈**：Fastify + TypeScript + Drizzle ORM + better-sqlite3 + Zod + @fastify/swagger
- **API 前缀**：`/api/v1`
- **Swagger UI**：`/api/docs`
- **架构模式**：三层架构
  - **Routes** - 路由层：参数解析、校验、响应
  - **Services** - 业务逻辑层：处理业务规则、调用 DB
  - **DB** - 数据访问层：Drizzle ORM 操作 SQLite
- **认证**：基于静态 Token 的 API 认证，所有 `/api/v1/*` 路由通过 preHandler 钩子校验 `x-testhub-token` 请求头
- **错误处理**：统一返回 `{ error: string }` 格式
- **Schema 校验**：使用 Zod schema（从 packages/shared 导入），自动生成 OpenAPI 文档
- **分页**：所有列表接口统一返回分页格式 `{ items, page, pageSize, total, totalPages }`，支持 `sortBy` 和 `sortOrder` 参数

### 数据模型

**11 张表：**

| 表名 | 说明 | 关键字段 |
|---|---|---|
| projects | 项目表 | name, description |
| libraries | 用例库表 | project_id, name, code(4位标识); UNIQUE(project_id, code) |
| directories | 目录表 | library_id, parent_id(onDelete: set null), name, sort_order |
| cases | 测试用例表 | library_id, directory_id(onDelete: set null), latest_version_no, title, precondition, content_type(text/step), text_content, text_expected, priority(P0-P3), case_type |
| case_steps | 用例步骤表 | id(PK), case_id, step_order, action, expected; UNIQUE(case_id, step_order) |
| tags | 标签表 | library_id, name; UNIQUE(library_id, name) |
| case_tags | 用例-标签关联表 | case_id, tag_id; PK(case_id, tag_id) |
| case_versions | 用例版本快照表 | case_id, version_no, title, precondition, content_type, text_content, text_expected, priority, case_type, steps_json, tags_json, created_at; UNIQUE(case_id, version_no) |
| plans | 测试计划表 | project_id, name, start_date, end_date, status(draft/in_progress/completed/archived) |
| plan_cases | 计划-用例执行表 | plan_id, case_id(onDelete: restrict), case_version_id(onDelete: restrict), execution_status(pending/passed/failed/blocked/skipped), remark, executed_at; UNIQUE(plan_id, case_id) |
| plan_case_status_histories | 计划用例状态变更历史表 | plan_case_id, plan_id, case_id, from_execution_status, to_execution_status, from_case_version_id, to_case_version_id, reason_type, reason_note, actor, source, created_at |

**数据库：**
- SQLite（单文件存储，位于 `apps/server/data/testhub.db`）
- 时间戳使用 text 类型存储 ISO 8601 格式
- 使用 Drizzle Kit 管理 migration

---

## 验收标准

### 项目和用例库管理
- [ ] 可以创建项目，填写名称和描述
- [ ] 可以在项目详情页查看用例库列表和测试计划入口
- [ ] 可以创建用例库，库标识码在同一项目下唯一
- [ ] 删除项目时级联删除其下所有用例库、用例、测试计划

### 目录管理
- [ ] 可以在用例库下创建多层级目录
- [ ] 目录树支持展开/折叠
- [ ] 可以重命名目录和移动目录（修改 parent_id）
- [ ] 删除目录时通过 caseMoveTo 参数控制用例归属（uncategorized 或 parent）

### 测试用例管理
- [ ] 可以创建测试用例，支持文本模式和步骤模式
- [ ] 步骤模式支持在表格中添加多个步骤行
- [ ] 可以给用例添加多个标签（支持选择已有标签或创建新标签）
- [ ] 用例列表支持按目录、优先级、类型、标签、关键词筛选
- [ ] 点击用例行弹出详情 Sheet，可以查看和编辑用例
- [ ] API 支持批量创建用例（接受用例对象数组）

### 标签管理
- [ ] 标签名称在同一用例库内唯一
- [ ] 删除标签时同时删除用例-标签关联关系
- [ ] 可以查看用例库下的所有标签列表

### 测试计划管理
- [ ] 可以创建测试计划，填写名称、描述、时间范围
- [ ] 可以通过用例 ID 数组添加用例到计划
- [ ] 可以按目录批量添加用例到计划（支持递归子目录）
- [ ] 计划中的用例列表显示执行状态，可以在行内下拉切换状态
- [ ] 可以为用例执行添加备注
- [ ] 支持批量更新多个用例的执行状态
- [ ] 计划详情页显示统计数据（总数、各状态数量和占比、通过率）
- [ ] 可以从计划中移除用例
- [ ] 删除计划时级联删除计划中的用例执行记录
- [ ] 用例加入计划时自动绑定当前版本
- [ ] 计划用例列表显示版本号

### API Token 认证
- [ ] 所有 `/api/v1/*` 接口需要有效的 `x-testhub-token` 请求头
- [ ] 系统首次启动自动生成 Token 并持久化到文件
- [ ] 支持通过环境变量 `TESTHUB_API_TOKEN` 预设 Token
- [ ] 可以通过 API 轮换 Token
- [ ] 前端通过 runtime-config.js 自动获取 Token
- [ ] TokenModal 组件可以展示和复制 Token

### 用例版本管理
- [ ] 创建用例时自动生成版本 1
- [ ] 更新用例时自动递增版本号并保存版本快照
- [ ] 可以查看用例的版本历史列表
- [ ] 可以查看指定版本的用例完整内容
- [ ] 用例列表中显示最新版本号

### 计划用例状态变更历史
- [ ] 每次状态变更自动记录历史（包含 actor、source、reasonType）
- [ ] 可以在状态更新时附带 reasonNote
- [ ] 计划详情页展示计划级状态变更时间线
- [ ] 可以查看单个计划用例的状态变更历史
- [ ] 批量更新状态时同样记录历史

### 分页与排序
- [ ] 所有列表接口统一返回分页格式（items, page, pageSize, total, totalPages）
- [ ] 支持 sortBy 和 sortOrder 参数
- [ ] pageSize 最大值为 100，默认值为 20

### API 和 OpenAPI 文档
- [ ] 所有 API 端点都注册了 Zod schema
- [ ] 访问 `/api/docs` 可以看到 Swagger UI
- [ ] OpenAPI 文档包含所有接口的请求/响应示例
- [ ] Agent / 脚本可以读取 OpenAPI schema 发现和调用 API

### 部署和启动
- [ ] 开发模式 `pnpm dev` 可以启动前后端热重载
- [ ] 生产模式 `pnpm build && pnpm start` 启动单进程（Fastify 同时 serve API 和前端静态文件）
- [ ] SQLite 数据文件可以方便备份和迁移

---

## 依赖关系

**前置依赖：**
- 无（这是独立的本地工具）

**后续影响：**
- 后续可能扩展的功能：
  - 导入/导出（Excel、JSON 格式）
  - 缺陷管理（关联缺陷到用例执行）
  - 测试报告生成
  - 多用户协作（如果需要部署到服务器）

---

## 风险与注意事项

**技术风险：**
- SQLite 的并发写入限制：单用户场景无影响，但如果后续需要多用户需考虑升级到 PostgreSQL
- 前端目录树组件：Shadcn/ui 无内置 Tree 组件，需要基于 Radix Collapsible 自行组合或使用社区方案

**业务风险：**
- 数据本地存储：需要用户自行备份数据文件，丢失后无法恢复
- API Token 认证为简单的静态 Token 校验，适合单人本地使用场景，不具备完整的用户权限体系

**注意事项：**
- API 设计需要考虑 agent 友好性：提供批量操作接口、清晰的错误信息、完整的 OpenAPI 文档
- 删除操作做级联删除时需要确保数据完整性（使用 Drizzle 的外键约束）
- 前端筛选条件较多时注意性能优化（使用 TanStack Query 的缓存和分页）

---

## 参考资料

- 设计参考：云效测试管理功能
  - [测试用例](https://help.aliyun.com/zh/yunxiao/user-guide/test-case)
  - [测试计划](https://help.aliyun.com/zh/yunxiao/user-guide/test-plan-1)
- 技术文档：见 [CLAUDE.md](../../CLAUDE.md) 和 [.claude/plans/hidden-cuddling-octopus.md](../../.claude/plans/hidden-cuddling-octopus.md)
- API 文档：启动服务后访问 `/api/docs`（Swagger UI）
