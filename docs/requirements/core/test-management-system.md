# TestHub - 本地优先测试管理系统

---

## 元信息

- **所属系统**：TestHub
- **所属模块**：核心功能（Core）
- **创建时间**：2026-02-09
- **最后更新**：2026-03-07
- **当前版本**：v2.0.0
- **状态**：开发中
- **负责人**：-

---

## 变更历史

| 日期 | 版本 | 变更类型 | 变更内容 | 影响文件 | 变更人 |
|------|------|----------|----------|----------|--------|
| 2026-02-09 | v1.0.0 | 新增 | 初始版本，包含项目管理、用例库管理、测试用例管理、测试计划管理四大核心功能 | 全部 | - |
| 2026-03-07 | v1.1.0 | 重构 | 项目从「页面入口」重构为「全局上下文切换器」：侧边栏新增项目下拉切换器，用例库和测试计划作为常驻导航；删除项目详情页，项目管理页改为独立管理页面；新增项目上下文持久化（localStorage） | 功能描述-项目管理、功能描述-侧边栏导航、技术实现-前端、验收标准 | - |
| 2026-03-07 | v2.0.0 | 重构 | **明确人机职责边界**：项目/用例库/目录/用例/标签/测试计划的增删改查仅通过 API 提供，前端删除相关编辑功能；前端专注于：(1) 用例库只读浏览（目录树、搜索、筛选、查看详情）；(2) 测试计划执行（状态流转、单个/批量标记用例状态、写备注）；测试计划状态（draft→in_progress→completed）由人类在 UI 控制 | 全部功能描述、用户故事、技术实现-前端、验收标准 | - |

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

**v1.1.0 补充**：实际使用中发现，用户通常只有少量项目（2-3 个），且会在某段时间内集中在同一个项目中工作。原有的「项目列表 → 项目详情 → 用例库/测试计划」的层级导航方式增加了不必要的跳转。将项目改为全局上下文切换器，用例库和测试计划作为常驻导航，更符合用户的实际使用心智。

**v2.0.0 补充 —— 人机职责边界**：

TestHub 的核心定位是**人类与 Agent 协作的测试管理工具**，参考 Linear、Moltbook 等产品的设计理念，明确划分人机职责：

| 职责 | 操作方 | 操作方式 | 说明 |
|------|--------|----------|------|
| 项目/用例库/目录结构管理 | Agent | API only | 保证目录结构与需求文档路径对齐 |
| 测试用例创建和维护 | Agent | API only | 遵循命名规范、自动去重 |
| 标签管理 | Agent | API only | 保持标签体系一致性 |
| 测试计划创建、用例规划 | Agent | API only | 自动化编排测试任务 |
| 用例库浏览（只读） | 人类 | Web UI | 查看目录树、搜索、筛选、查看详情 |
| 测试计划状态流转 | 人类 | Web UI | draft → in_progress → completed |
| 执行测试、标记结果 | 人类 | Web UI | 单个/批量标记状态、写备注 |

**设计原理**：
- **避免数据不一致**：如果人类和 Agent 都能修改用例，会产生同步冲突。限定单一数据源（Agent）可彻底避免此问题
- **保证结构化映射**：用例库目录需与需求文档路径对齐，人类手动创建会破坏映射关系
- **减少前端复杂度**：前端专注于「执行测试」这一核心场景，代码更简洁、维护成本更低
- **职责清晰**：Agent 负责「生成和管理数据」，人类负责「执行测试和判断结果」

---

## 功能描述

### 1. 项目管理（修改于 v2.0.0）

**功能概述：**
项目是 TestHub 的顶层容器，一个项目下可以包含多个用例库和测试计划。**v2.0.0 修改**：项目的创建、编辑、删除仅通过 API 操作，前端仅提供项目切换功能。

**操作方式：API only** ⚙️

Agent / 脚本通过 API 完成项目的增删改查，前端不提供项目管理界面。

**前端交互：**
- 用户通过侧边栏顶部的项目切换器选择当前工作项目
- 切换项目后，侧边栏的用例库列表和测试计划入口自动更新为对应项目的数据
- **v2.0.0 删除**：~~项目管理页（`/projects`）~~，~~「管理项目」入口~~

**API 支持：**
- `GET /api/v1/projects` - 获取项目列表
- `POST /api/v1/projects` - 创建项目
- `GET /api/v1/projects/:id` - 获取项目详情
- `PUT /api/v1/projects/:id` - 更新项目
- `DELETE /api/v1/projects/:id` - 删除项目（级联删除）

### 2. 侧边栏导航与项目上下文切换（修改于 v2.0.0）

**功能概述：**
侧边栏提供全局导航结构，项目作为上下文切换器置于侧边栏顶部，用例库和测试计划作为常驻导航项，数据根据当前选中项目动态展示。

**导航结构：**
```
侧边栏
├── [项目切换器]          ← 下拉组件，显示当前项目名，可切换项目
│   ├── 项目A             ← 点击切换当前项目
│   ├── 项目B
│   └── ...               ← v2.0.0 删除「管理项目」入口
├── 用例库                ← 常驻导航分组（只读浏览）
│   ├── {库名1}           ← 点击进入 /projects/:pid/libraries/:lid
│   ├── {库名2}
│   └── ...
├── 测试计划              ← 常驻导航，点击进入 /projects/:pid/plans
│
└── API 令牌（底部固定）
```

**交互规则：**
- **项目切换器**：始终显示在侧边栏顶部 Brand 区域下方，展示当前选中项目的名称，点击展开下拉列表
- **用例库列表**：从 API 获取当前项目下的用例库列表，每个用例库显示为一个导航链接
- **测试计划入口**：固定导航链接，指向当前项目的测试计划列表页
- **高亮规则**：当前所在的用例库或测试计划页面对应的导航项高亮显示
- **数据加载**：通过 TanStack Query 请求用例库列表数据，利用缓存避免重复请求

**项目上下文持久化：**
- 用户选择的当前项目 ID 存储在 `localStorage`，刷新页面后保持选中状态
- 首次访问（无已选项目）时，自动选中第一个项目；若无项目则显示提示信息（引导通过 API 创建）
- 切换项目后，如果当前页面是其他项目的子页面（用例库详情、计划详情等），自动跳转到合适的默认页面

### 3. 用例库管理（修改于 v2.0.0）

**功能概述：**
用例库归属于项目，用于组织和管理测试用例。每个用例库有独立的目录树结构和标签体系。

**操作方式：API only** ⚙️

Agent / 脚本通过 API 完成用例库的增删改查，前端仅提供只读浏览。

**字段说明：**
- **库名称**：用例库的显示名称
- **库标识码**：4 位大写英文字母或数字标识（正则 `^[A-Z0-9]{4}$`，如 CORE、AUTH），同一项目下唯一
- **描述**：可选，说明用例库的用途

**前端交互（只读）：**
- 侧边栏显示当前项目下的用例库列表
- 点击用例库进入用例浏览页（目录树 + 用例列表）
- **v2.0.0 删除**：~~创建用例库表单~~、~~编辑用例库~~、~~删除用例库按钮~~

**API 支持：**
- `GET /api/v1/projects/:projectId/libraries` - 获取用例库列表
- `POST /api/v1/projects/:projectId/libraries` - 创建用例库
- `GET /api/v1/libraries/:id` - 获取用例库详情
- `PUT /api/v1/libraries/:id` - 更新用例库
- `DELETE /api/v1/libraries/:id` - 删除用例库（级联删除）

### 4. 目录管理（修改于 v2.0.0）

**功能概述：**
用例库内的树形目录结构，用于分类组织测试用例。目录结构需与需求文档路径对齐，为自动化生成用例提供确定性映射。

**操作方式：API only** ⚙️

Agent / 脚本通过 API 完成目录的增删改查，前端仅提供只读浏览。

**目录规则：**
- 支持多层级嵌套（parent_id 为空表示根目录）
- 删除目录时通过 `caseMoveTo` 参数控制用例处理方式：`uncategorized`（默认，用例变为未分类）或 `parent`（用例移动到父目录）
- 子目录的 parent_id 自动置空变为根级

**前端交互（只读）：**
- 用例浏览页左侧显示目录树
- 支持展开/折叠目录节点
- 点击目录节点筛选右侧用例列表
- **v2.0.0 删除**：~~创建目录~~、~~重命名目录~~、~~移动目录~~、~~删除目录~~、~~目录右键菜单~~

**API 支持：**
- `GET /api/v1/libraries/:libraryId/directories` - 获取目录树（树形结构）
- `POST /api/v1/libraries/:libraryId/directories` - 创建目录
- `GET /api/v1/directories/:id` - 获取目录详情
- `PUT /api/v1/directories/:id` - 更新目录（重命名、移动）
- `DELETE /api/v1/directories/:id?caseMoveTo=uncategorized|parent` - 删除目录

### 5. 测试用例管理（修改于 v2.0.0）

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

#### 5.1 用例增删改查（API only）⚙️

Agent / 脚本通过 API 完成用例的创建、更新、删除。

**单个创建：**
- 调用 `POST /api/v1/libraries/:libraryId/cases`
- 请求体包含用例字段、所属目录、标签等

**批量创建：**
- 调用 `POST /api/v1/libraries/:libraryId/cases/batch`
- 请求体包含多个用例对象数组
- 系统自动创建用例并关联标签
- 遵循命名规范、支持去重校验

**更新和删除：**
- `PUT /api/v1/cases/:id` - 更新用例
- `DELETE /api/v1/cases/:id` - 删除用例

**v2.0.0 删除**：~~前端新建用例按钮~~、~~用例编辑表单~~、~~用例删除按钮~~

#### 5.2 用例浏览（前端只读）👁️

前端提供完整的用例浏览功能，供人类在执行测试前查看用例内容。

**目录树导航：**
- 用例浏览页左侧显示目录树
- 点击目录节点筛选右侧用例列表
- 点击「全部用例」显示所有用例
- 点击「未分类」显示无目录的用例

**用例列表：**
- 显示用例标题、优先级、类型、标签、版本号
- 支持分页和排序

**筛选和搜索：**
- 按优先级筛选：下拉选择 P0/P1/P2/P3
- 按类型筛选：下拉选择功能测试、性能测试等
- 按标签筛选：选择一个或多个标签
- 关键词搜索：在用例标题/内容中搜索

**用例详情（只读）：**
- 点击用例行，右侧弹出 Sheet/Drawer 显示用例详情
- 查看用例的完整信息：标题、前置条件、执行步骤、预期结果、优先级、类型、标签、版本历史
- **v2.0.0 删除**：~~详情页编辑功能~~

**API 支持：**
- `GET /api/v1/libraries/:libraryId/cases` - 获取用例列表（支持筛选参数：directoryId、priority、type、tag、keyword；支持分页和排序）
- `POST /api/v1/libraries/:libraryId/cases` - 创建单个用例（自动创建版本快照）
- `POST /api/v1/libraries/:libraryId/cases/batch` - 批量创建用例（每个用例自动创建版本快照）
- `GET /api/v1/cases/:id` - 获取用例详情（含步骤和标签）
- `PUT /api/v1/cases/:id` - 更新用例（自动递增版本号并创建新版本快照）
- `DELETE /api/v1/cases/:id` - 删除用例
- `GET /api/v1/cases/:id/versions` - 获取用例版本历史列表
- `GET /api/v1/cases/:id/versions/:versionNo` - 获取指定版本详情

### 6. 标签管理（修改于 v2.0.0）

**功能概述：**
标签归属于用例库，用于灵活分类用例。每个标签在同一用例库内名称唯一。

**操作方式：API only** ⚙️

Agent / 脚本通过 API 完成标签的增删，前端仅在筛选时使用标签列表。

**前端交互（只读）：**
- 用例浏览页的筛选器中显示标签下拉列表
- 用例详情中显示关联的标签
- **v2.0.0 删除**：~~标签管理页~~、~~创建/删除标签按钮~~

**API 支持：**
- `GET /api/v1/libraries/:libraryId/tags` - 获取标签列表
- `POST /api/v1/libraries/:libraryId/tags` - 创建标签
- `DELETE /api/v1/tags/:id` - 删除标签

### 7. 测试计划管理（修改于 v2.0.0）

**功能概述：**
测试计划用于组织一次测试活动，从用例库中选择用例纳入计划，并跟踪每个用例的执行状态。

**计划字段：**
- **计划名称**（必填）：测试计划的名称
- **描述**（可选）：计划的详细说明
- **时间范围**：开始日期和结束日期（可选）
- **状态**：草稿（draft）、进行中（in_progress）、已完成（completed）、已归档（archived）

#### 7.1 计划创建与用例规划（API only）⚙️

Agent / 脚本通过 API 完成测试计划的创建、用例规划、计划删除。

**创建测试计划：**
- 调用 `POST /api/v1/projects/:projectId/plans`
- 请求体包含计划名称、描述、时间范围
- 初始状态为"草稿"（draft）

**向计划中添加用例：**

**方式 1：按用例 ID 添加**
- 调用 `POST /api/v1/plans/:planId/cases`
- 请求体：`{ caseIds: number[] }`

**方式 2：按目录批量添加**
- 调用 `POST /api/v1/plans/:planId/cases/by-directory`
- 请求体：`{ directoryId: number, recursive?: boolean }`

**从计划中移除用例：**
- 调用 `DELETE /api/v1/plans/:planId/cases/:planCaseId`

**删除计划：**
- 调用 `DELETE /api/v1/plans/:id`
- 级联删除计划中的用例执行记录

**v2.0.0 删除**：~~前端新建计划按钮~~、~~添加用例弹窗~~、~~按目录添加功能~~、~~移除用例按钮~~、~~删除计划按钮~~

#### 7.2 计划状态流转（前端控制）🎛️

测试计划的状态流转由人类在前端控制。

**状态流转：**
```
draft（草稿） → in_progress（进行中） → completed（已完成） → archived（已归档）
```

**前端交互：**
- 测试计划列表页显示所有计划及其状态
- 计划详情页顶部显示当前状态和状态切换按钮
- 点击「开始执行」将计划从 draft 切换到 in_progress
- 点击「完成计划」将计划从 in_progress 切换到 completed
- 点击「归档」将计划切换到 archived

**API 支持：**
- `PUT /api/v1/plans/:id` - 更新计划状态

#### 7.3 执行测试和标记状态（前端核心功能）✅

这是人类在前端的**核心操作场景**。

**执行状态：**
- 待执行（pending）
- 通过（passed）
- 失败（failed）
- 阻塞（blocked）
- 跳过（skipped）

**单个用例标记：**
- 在计划详情页的用例列表中，每行有一个执行状态下拉框
- 直接选择状态即可更新
- 可以添加执行备注

**查看用例详情：**
- 点击用例行，侧边抽屉显示用例完整信息（前置条件、步骤、预期结果）
- 按照用例描述执行测试
- 标记执行状态并填写备注（如失败原因、截图链接等）
- 可附带原因备注（reasonNote），记录本次状态变更的原因

**批量标记状态：**
- 勾选多个用例
- 点击「批量标记」按钮
- 选择统一的状态（如"通过"）
- 可填写统一的备注
- 确认后批量更新

**API 支持：**
- `GET /api/v1/plans/:planId/cases` - 获取计划中的用例列表（支持按状态筛选、分页排序）
- `PUT /api/v1/plans/:planId/cases/:planCaseId` - 更新执行状态、备注和原因备注
- `POST /api/v1/plans/:planId/cases/batch-status` - 批量更新状态（支持 reasonNote）
- `GET /api/v1/plans/:planId/cases/:planCaseId/history` - 获取单个用例的状态变更历史
- `GET /api/v1/plans/:planId/history` - 获取计划级状态变更时间线

#### 7.4 查看计划统计

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

**API 汇总：**
- `GET /api/v1/projects/:projectId/plans` - 获取测试计划列表
- `POST /api/v1/projects/:projectId/plans` - 创建测试计划
- `GET /api/v1/plans/:id` - 获取计划详情（含统计摘要）
- `PUT /api/v1/plans/:id` - 更新计划（状态、名称、描述等）
- `DELETE /api/v1/plans/:id` - 删除计划

### 8. API Token 认证

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

### 9. 用例版本管理

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

### 10. 计划用例状态变更历史

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

### Agent 角色（API 操作）

- 作为 **Coding Agent**，我想要通过 API 批量创建测试用例，以便让 AI 自动生成的用例快速落地到测试管理工具
- 作为 **Coding Agent**，我想要通过 API 管理项目和用例库结构，以便保持目录与需求文档路径对齐
- 作为 **Coding Agent**，我想要通过 API 创建测试计划并自动添加用例，以便实现测试任务的自动化编排
- 作为 **Coding Agent**，我想要读取 OpenAPI 文档，以便了解可用的 API 端点和参数

### 人类角色（UI 操作）

- 作为 **测试执行人员**，我想要在 Web UI 上浏览用例库内容，以便了解需要测试什么
- 作为 **测试执行人员**，我想要在 Web UI 上查看测试计划中的用例列表，以便逐条执行测试
- 作为 **测试执行人员**，我想要在 Web UI 上标记用例执行状态（通过/失败/阻塞/跳过），以便记录测试结果
- 作为 **测试执行人员**，我想要批量标记多个用例的状态，以便提高执行效率
- 作为 **测试执行人员**，我想要为执行结果添加备注，以便记录失败原因或补充说明
- 作为 **测试执行人员**，我想要控制测试计划的状态流转（草稿→进行中→完成），以便管理测试进度
- **（修改于 v2.0.0）** 作为 **测试工程师**，我想要通过侧边栏快速切换项目和浏览用例库，以便减少页面跳转提高工作效率

### 通用角色

- 作为 **测试管理者**，我想要查看测试计划的统计数据，以便了解测试进度和质量情况
- 作为 **测试管理者**，我想要查看计划中每个用例的状态变更历史，以便了解测试执行的完整过程
- 作为 **开发人员**，我想要本地存储测试数据，以便无需依赖云服务即可使用测试管理工具
- 作为 **测试工程师**，我想要通过 API Token 认证保护接口，以便防止未授权的访问
- 作为 **测试工程师**，我想要查看用例的版本历史，以便追溯用例的修改记录

---

## 技术实现

> 简要说明实现要点，详细设计见代码注释和 CLAUDE.md

### 前端（修改于 v2.0.0）

- **技术栈**：React + TypeScript + Vite + Shadcn/ui + Tailwind CSS + TanStack Query + React Router v6 + Phosphor-icons
- **路由**（修改于 v2.0.0）：
  - `/projects/:projectId/libraries/:libraryId` - 用例浏览页（目录树 + 用例列表，只读）
  - `/projects/:projectId/plans` - 测试计划列表
  - `/projects/:projectId/plans/:planId` - 测试计划详情（用例列表 + 执行 + 统计）
  - **v2.0.0 删除**：~~`/projects` - 项目管理页~~（项目通过 API 管理）
  - **v1.1.0 删除**：~~`/projects/:projectId` - 项目详情页~~
- **主要组件**：
  - `LayoutShell` - 应用外壳布局（侧边栏导航 + 主内容区）
  - `ProjectSwitcher` - 项目切换器下拉组件
  - `DirectoryTree` - 目录树组件（只读，支持展开/折叠）**v2.0.0 删除**：~~右键菜单~~
  - `CaseTable` - 用例列表表格（TanStack Table，只读）
  - `CaseDetailSheet` - 用例详情侧边栏（只读）**v2.0.0 删除**：~~编辑功能~~
  - `PlanStatsBar` - 测试计划统计条
  - `PlanStatusControl` - 测试计划状态流转控制（v2.0.0 新增）
  - `ExecutionStatusDropdown` - 执行状态下拉组件
  - `BatchStatusDialog` - 批量标记状态弹窗
  - `TokenModal` - API Token 展示和复制弹窗
  - **v2.0.0 删除**：~~`CaseForm` - 用例表单组件~~、~~`LibraryFormDialog`~~、~~`DirectoryFormDialog`~~、~~`PlanFormDialog`~~
- **状态管理**：使用 TanStack Query 管理服务端状态，自动缓存和重验证；当前选中项目 ID 存储在 localStorage
- **Runtime Config**：服务端通过 `/runtime-config.js` 注入配置（apiBase、apiToken、bootId），前端在运行时读取
- **关键交互**（v2.0.0 精简）：
  - 用例列表点击行展开详情（只读查看）
  - 目录树点击节点筛选用例
  - 测试计划状态流转按钮（draft → in_progress → completed → archived）
  - 测试计划中行内下拉切换用例执行状态
  - 批量选择用例进行批量标记状态
  - 计划用例支持查看状态变更历史（抽屉组件）
  - 计划详情页展示完整状态变更时间线
  - 侧边栏项目切换器切换当前项目

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

### API 功能（Agent 操作）⚙️

#### 项目管理（API only，v2.0.0 修改）
- [ ] API 可以创建项目，填写名称和描述
- [ ] API 可以获取项目列表和详情
- [ ] API 可以更新项目信息
- [ ] API 删除项目时级联删除其下所有用例库、用例、测试计划
- [ ] **（v2.0.0 删除）** ~~前端项目管理页~~

#### 用例库管理（API only，v2.0.0 修改）
- [ ] API 可以创建用例库，库标识码在同一项目下唯一
- [ ] API 可以编辑和删除用例库（级联删除其下所有目录、用例、标签）
- [ ] **（v2.0.0 删除）** ~~前端创建/编辑/删除用例库功能~~

#### 目录管理（API only，v2.0.0 修改）
- [ ] API 可以在用例库下创建多层级目录
- [ ] API 可以重命名目录和移动目录（修改 parent_id）
- [ ] API 删除目录时通过 caseMoveTo 参数控制用例归属（uncategorized 或 parent）
- [ ] **（v2.0.0 删除）** ~~前端创建/编辑/删除目录功能~~、~~目录右键菜单~~

#### 测试用例管理（API only，v2.0.0 修改）
- [ ] API 可以创建测试用例，支持文本模式和步骤模式
- [ ] API 步骤模式支持多个步骤行
- [ ] API 可以给用例添加多个标签
- [ ] API 支持批量创建用例（接受用例对象数组）
- [ ] API 可以更新和删除用例
- [ ] **（v2.0.0 删除）** ~~前端新建/编辑/删除用例功能~~

#### 标签管理（API only，v2.0.0 修改）
- [ ] API 标签名称在同一用例库内唯一
- [ ] API 删除标签时同时删除用例-标签关联关系
- [ ] **（v2.0.0 删除）** ~~前端标签管理功能~~

#### 测试计划创建与用例规划（API only，v2.0.0 修改）
- [ ] API 可以创建测试计划，填写名称、描述、时间范围
- [ ] API 可以通过用例 ID 数组添加用例到计划
- [ ] API 可以按目录批量添加用例到计划（支持递归子目录）
- [ ] API 可以从计划中移除用例
- [ ] API 删除计划时级联删除计划中的用例执行记录
- [ ] API 用例加入计划时自动绑定当前版本
- [ ] **（v2.0.0 删除）** ~~前端新建计划/添加用例/移除用例/删除计划功能~~

### 前端功能（人类操作）👁️✅

#### 侧边栏导航与项目上下文切换（v2.0.0 修改）
- [ ] 侧边栏顶部显示项目切换器，展示当前项目名称
- [ ] 点击项目切换器展开下拉，可切换到其他项目
- [ ] **（v2.0.0 删除）** ~~项目切换器下拉底部「管理项目」入口~~
- [ ] 侧边栏常驻显示当前项目的用例库列表，点击可直接进入用例浏览页
- [ ] 侧边栏常驻显示「测试计划」导航入口，点击进入当前项目的计划列表
- [ ] 当前页面对应的侧边栏导航项高亮显示
- [ ] 选中的项目 ID 持久化到 localStorage，刷新后保持
- [ ] 首次访问自动选中第一个项目；无项目时显示提示信息
- [ ] 切换项目后，若当前在其他项目子页面，自动跳转到合适的默认页

#### 用例库浏览（只读，v2.0.0 新增）
- [ ] 用例浏览页左侧显示目录树，支持展开/折叠
- [ ] 点击目录节点筛选右侧用例列表
- [ ] 用例列表支持按优先级、类型、标签筛选
- [ ] 用例列表支持关键词搜索
- [ ] 点击用例行弹出详情 Sheet，可查看用例完整信息（只读）
- [ ] 用例列表显示版本号
- [ ] **（v2.0.0 强调）** 所有浏览功能为只读，无编辑入口

#### 测试计划状态流转（v2.0.0 新增）
- [ ] 测试计划列表显示计划状态
- [ ] 计划详情页顶部显示当前状态和状态切换按钮
- [ ] 可以将计划从 draft 切换到 in_progress（开始执行）
- [ ] 可以将计划从 in_progress 切换到 completed（完成计划）
- [ ] 可以将计划切换到 archived（归档）

#### 测试执行与状态标记（核心功能）
- [ ] 计划详情页显示用例列表，每行有执行状态下拉框
- [ ] 可以在行内下拉切换用例执行状态（pending/passed/failed/blocked/skipped）
- [ ] 点击用例行，侧边抽屉显示用例完整信息，供执行参考
- [ ] 可以为用例执行添加备注
- [ ] 支持勾选多个用例，批量标记状态
- [ ] 批量标记时可填写统一备注
- [ ] 计划详情页显示统计数据（总数、各状态数量和占比、通过率）
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
