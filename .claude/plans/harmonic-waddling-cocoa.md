# TestHub 前端功能补全开发计划

## Context

TestHub 的后端（API + 数据库）和共享包（Zod schemas + 类型）已全部实现完毕，共 35+ 个 API 端点、11 张数据表、40+ 个 Zod schema。但前端仅完成了基础骨架，大量需求文档中定义的功能缺失。当前前端使用纯自定义 CSS 开发，与需求文档要求的 Shadcn/ui + Tailwind CSS 技术栈不一致。

本计划旨在补全所有缺失的前端功能，同时增量迁移到 Shadcn/ui + Tailwind CSS。

---

## 一、现状分析

### 后端：已完成 (无需改动)

所有 API 端点已实现，包括：Projects CRUD、Libraries CRUD、Directories CRUD（含树形返回）、Cases CRUD + 批量创建 + 筛选 + 版本历史、Tags CRUD、Plans CRUD + 统计、Plan Cases 添加/移除/状态更新/批量更新/历史记录、Auth Token 管理。

### 共享包：已完成 (无需改动)

所有 Zod schema 和 TypeScript 类型已定义，覆盖全部实体的 create/update/response/query schema。

### 前端：缺失功能清单

#### 缺失的 API Hooks（23 个）

| 文件 | 缺失的 Hook | 对应端点 |
|---|---|---|
| `api/projects.ts` | `useProject`, `useUpdateProject`, `useDeleteProject` | GET/PUT/DELETE `/projects/:id` |
| `api/libraries.ts` | `useLibrary`, `useCreateLibrary`, `useUpdateLibrary`, `useDeleteLibrary` | GET `/libraries/:id`, POST/PUT/DELETE |
| `api/directories.ts` (**新文件**) | `useDirectoryTree`, `useCreateDirectory`, `useUpdateDirectory`, `useDeleteDirectory` | 全部目录端点 |
| `api/cases.ts` | `useCase`, `useCreateCase`, `useUpdateCase`, `useDeleteCase`, `useBatchCreateCases`, `useCaseVersions`, `useCaseVersion` | 用例 CRUD + 版本 |
| `api/tags.ts` (**新文件**) | `useTags`, `useCreateTag`, `useDeleteTag` | 标签 CRUD |
| `api/plans.ts` | `useUpdatePlan`, `useDeletePlan` | PUT/DELETE `/plans/:id` |
| `api/plan-cases.ts` | `useAddPlanCases`, `useAddPlanCasesByDirectory`, `useRemovePlanCase` | 添加/按目录添加/移除 |

此外，现有 `useCases` hook 缺少筛选参数（directoryId、priority、type、tag、keyword）。

#### 缺失的页面功能

| 页面 | 缺失功能 |
|---|---|
| ProjectsPage | 编辑项目、删除项目（含确认弹窗） |
| ProjectDetailPage | 显示项目名称（当前只显示 ID）、创建用例库、编辑/删除用例库、编辑/删除项目 |
| LibraryCasesPage | 目录树、用例创建/编辑/删除、用例详情 Sheet、筛选/搜索、标签管理、版本历史 |
| PlansPage | 编辑计划、删除计划 |
| PlanDetailPage | 编辑计划信息、向计划添加用例、按目录添加用例、从计划移除用例 |

#### 缺失的组件

- `DirectoryTree` — 目录树组件（展开/折叠、右键菜单、创建/重命名/移动/删除）
- `CaseForm` — 用例表单（文本模式 + 步骤模式、标签选择）
- `CaseDetailSheet` — 用例详情侧边面板
- `CaseFilters` — 用例筛选栏
- `CaseVersionHistory` — 版本历史列表 + 版本详情
- `TagMultiSelect` — 标签多选组件（支持新建标签）
- `AddCasesDialog` — 向计划添加用例的弹窗
- `ConfirmDialog` — 通用删除确认弹窗

#### 已发现的代码质量问题

1. **`Paginated<T>` 接口重复定义** — 在 5 个 API hook 文件中各自定义了相同的 `Paginated<T>` interface，应提取到公共文件
2. **项目详情页显示 ID 而非名称** — `ProjectDetailPage` 显示 `Project {projectId}` 而不是实际项目名称
3. **无表单校验** — 现有表单仅用 `trim()` 做基本检查，未复用共享包的 Zod schema
4. **硬编码分页** — `pageSize: 100/200` 硬编码，无前端分页 UI
5. **未使用的依赖** — Phosphor Icons 已安装但未使用；Tailwind CSS 在 devDeps 但未配置

---

## 二、分阶段实施计划

### Phase 0: Shadcn/ui + Tailwind 基础设施搭建 ✅ 已完成

**目标**：搭建设计系统基础，使后续所有新功能使用正确的技术栈。

**具体工作**：

1. ~~配置 Tailwind CSS~~ ✅
   - 创建 `apps/web/tailwind.config.ts`（将现有 CSS 变量中的颜色体系迁移到 Tailwind theme tokens） ✅
   - 创建 `apps/web/postcss.config.js` ✅
   - 创建 `apps/web/src/styles/globals.css`（`@tailwind base/components/utilities` + CSS 变量） ✅

2. ~~初始化 Shadcn/ui~~ ✅
   - 创建 `apps/web/components.json`（可选；组件已就绪）
   - 安装依赖：`tailwind-merge`, `clsx`, `class-variance-authority`, `@radix-ui/react-*` 系列 ✅
   - 创建 `apps/web/src/lib/utils.ts`（`cn()` 工具函数） ✅
   - 生成所需的 Shadcn/ui 基础组件到 `apps/web/src/components/ui/`：
     `button`, `input`, `label`, `textarea`, `select`, `dialog`, `alert-dialog`, `sheet`, `dropdown-menu`, `popover`, `command`, `table`, `badge`, `separator`, `tooltip`, `tabs`, `checkbox`, `scroll-area`（已具备当前阶段所需组件） ✅

3. ~~安装表单库~~
   - `react-hook-form` + `@hookform/resolvers`（用于对接 Zod schema 做表单校验） ✅

4. ~~创建通用应用组件~~ ✅
   - `apps/web/src/components/confirm-dialog.tsx` — 通用确认弹窗（基于 AlertDialog） ✅
   - `apps/web/src/components/priority-badge.tsx` — P0-P3 优先级标签 ✅
   - `apps/web/src/components/status-badge.tsx` — 执行状态标签 ✅
   - `apps/web/src/components/plan-status-badge.tsx` — 计划状态标签 ✅

5. ~~提取公共类型~~
   - 创建 `apps/web/src/api/types.ts`，提取 `Paginated<T>` 接口，全部 hook 文件改为从此导入 ✅

6. ~~确保现有页面不受影响（旧 `styles.css` 暂时保留共存）~~ ✅

**涉及文件**：
- 新建约 25 个文件（Tailwind/PostCSS 配置 + Shadcn/ui 组件 + 通用组件 + 类型文件）
- 修改：`apps/web/package.json`, `apps/web/src/main.tsx`, 5 个 API hook 文件（提取 Paginated）

**验证方式**：
- `pnpm dev` 正常启动
- 现有页面正常渲染
- 在任意组件中使用 Tailwind class 和 Shadcn/ui 组件能正常显示
- `pnpm build` 成功

---

### Phase 1: 项目 + 用例库完整 CRUD ✅ 已完成

**目标**：补全项目和用例库的编辑、删除功能，使用 Shadcn/ui 重写这两个页面。

**API Hooks 新增**：✅
- `api/projects.ts`：`useProject(id)`, `useUpdateProject()`, `useDeleteProject()`
- `api/libraries.ts`：`useLibrary(id)`, `useCreateLibrary(projectId)`, `useUpdateLibrary()`, `useDeleteLibrary(projectId)`

**页面改造**：✅

`pages/projects/projects-page.tsx`：
- "新建项目"改为点击按钮弹出 Dialog 表单（react-hook-form + `createProjectSchema`） ✅
- 项目列表改用 Shadcn Table，每行添加"编辑"和"删除"操作按钮（Phosphor icons） ✅
- 编辑弹出 Dialog 预填数据；删除弹出 ConfirmDialog ✅

`pages/projects/project-detail-page.tsx`：
- 使用 `useProject(projectId)` 获取并显示项目真实名称和描述 ✅
- 添加"创建用例库"按钮 → Dialog 表单（name + code + description，校验 `createLibrarySchema`） ✅
- 用例库列表项添加编辑/删除操作 ✅
- 添加项目编辑/删除入口 ✅

**涉及文件**：
- 修改：`api/projects.ts`, `api/libraries.ts`, `projects-page.tsx`, `project-detail-page.tsx`

**验证方式**：
- 创建项目 → 列表中显示 → 编辑名称 → 列表更新 → 删除 → 确认弹窗 → 项目消失
- 创建用例库（含 4 位标识码校验） → 显示在项目详情 → 编辑 → 删除（含确认）
- 项目详情页显示真实项目名称

---

### Phase 2: 目录树 + 标签管理 ✅ 已完成

**目标**：构建目录树组件和标签管理功能，为用例管理页面做准备。

**API Hooks 新增**：✅
- 新建 `api/directories.ts`：`useDirectoryTree(libraryId)`, `useCreateDirectory(libraryId)`, `useUpdateDirectory(libraryId)`, `useDeleteDirectory(libraryId)`
- 新建 `api/tags.ts`：`useTags(libraryId)`, `useCreateTag(libraryId)`, `useDeleteTag(libraryId)`

**组件开发**：✅

`components/directory-tree/directory-tree.tsx`：
- Props: `libraryId`, `selectedId`, `onSelect(id | null)` ✅
- 顶部"全部用例"节点（选中时 `selectedId = null`）✅
- 递归渲染目录节点，支持展开/折叠（Phosphor `CaretRight`/`CaretDown`）✅
- 底部"新建目录"按钮 ✅

`components/directory-tree/directory-node.tsx`：
- 单个节点：点击选中，kebab 菜单（DropdownMenu）→ 新建子目录、重命名、移动、删除 ✅
- 缩进层级 ✅

`components/directory-tree/directory-form-dialog.tsx`：
- 创建/重命名共用表单 Dialog ✅

`components/directory-tree/move-directory-dialog.tsx`：
- 选择目标父目录的 Dialog（排除自身及子节点）✅

`components/tag-manager.tsx`：
- 用例库标签列表 + 内联新建 + 删除（含确认）✅

**涉及文件**：✅
- 新建：`api/directories.ts`, `api/tags.ts`, 4 个目录树组件, `tag-manager.tsx`
- 修改：`pages/libraries/library-cases-page.tsx`（左侧目录树 + 标签管理，右侧用例列表）

**验证方式**：
- 在用例库页面左侧显示目录树 → 创建根目录 → 创建子目录 → 重命名 → 移动到不同父级 → 删除（选择用例归属策略）✅
- 标签管理：创建标签 → 列表显示 → 删除标签 ✅

---

### Phase 3: 测试用例完整 CRUD + 筛选 + 详情面板 + 版本历史 ✅ 已完成

**目标**：这是最核心也是最大的一个阶段，完成用例管理页面的全部功能。

**API Hooks 新增/修改**：✅
- `api/cases.ts` 修改 `useCases` 支持筛选参数（directoryId, priority, type, tag, keyword）✅
- `api/cases.ts` 新增：`useCase(id)`, `useCreateCase(libraryId)`, `useUpdateCase(libraryId)`, `useDeleteCase(libraryId)`, `useBatchCreateCases(libraryId)`, `useCaseVersions(caseId)`, `useCaseVersion(caseId, versionNo)` ✅

**组件开发**：✅

`components/case-form/case-form.tsx`：✅
- 用例创建/编辑主表单，使用 react-hook-form + `createCaseSchema`/`updateCaseSchema` ✅
- 字段：title, precondition, contentType（切换）, priority（Select P0-P3）, caseType（Select）, directoryId（Select）✅
- 根据 contentType 条件渲染 CaseTextEditor 或 CaseStepsEditor ✅
- 底部 TagMultiSelect ✅

`components/case-form/case-text-editor.tsx`：✅
- 文本模式：textContent + textExpected 两个 Textarea ✅

`components/case-form/case-steps-editor.tsx`：✅
- 步骤模式：动态表格，每行 stepOrder(自动) + action(input) + expected(input) + 删除按钮 ✅
- "添加步骤"按钮 ✅
- 使用 react-hook-form `useFieldArray` ✅

`components/case-form/tag-multi-select.tsx`：✅
- 基于 Shadcn Popover + ScrollArea 的标签多选（支持搜索 + 新建）✅
- 显示已选标签为 Badge pills ✅
- 支持搜索已有标签 + 创建新标签 ✅

`components/case-detail-sheet.tsx`：✅
- Shadcn Sheet（右侧滑出）✅
- 展示用例完整信息 ✅
- "编辑"按钮 → 切换为 CaseForm 编辑模式 ✅
- "删除"按钮 → ConfirmDialog ✅
- Tabs："详情" | "版本历史" ✅

`components/case-version-history.tsx`：✅
- 版本列表（版本号、创建时间、优先级、类型）✅
- 点击查看版本详情 ✅

`components/case-version-detail.tsx`：✅
- 版本快照只读展示（title, content/steps, tags, priority, type）✅

`components/case-filters.tsx`：✅
- 水平筛选栏：优先级 Select、类型 Select、标签 Select、关键词搜索 Input（带 debounce）✅
- "清除筛选"按钮 ✅

**页面改造**：✅

`pages/libraries/library-cases-page.tsx` **完全重写**：✅
- 两栏布局：左侧目录树（~260px）+ 右侧主内容 ✅
- 右侧顶部：用例库名称 + 面包屑、"新建用例"按钮 ✅
- 筛选栏（CaseFilters）✅
- 用例列表 Shadcn Table：Title（可点击→打开 CaseDetailSheet）、Priority（PriorityBadge）、Type、Tags（Badge 列表）、Version、Updated ✅
- 点击目录树节点筛选对应目录的用例 ✅
- CaseDetailSheet 渲染在右侧 ✅

**涉及文件**：✅
- 修改：`api/cases.ts` ✅
- 新建：Sheet/Popover/Tabs/ScrollArea（ui）、case-form 目录（4 个文件）、case-detail-sheet.tsx、case-version-history.tsx、case-version-detail.tsx、case-filters.tsx ✅
- 重写：`library-cases-page.tsx` ✅

**验证方式**：
- 目录树点击 → 用例列表按目录筛选
- 使用筛选控件 → 按优先级/类型/标签/关键词过滤
- 新建用例（文本模式） → 列表显示 → 点击查看详情 → 编辑 → 保存 → 数据更新
- 新建用例（步骤模式） → 添加多个步骤 → 保存 → 详情中显示步骤表
- 标签多选：选择已有标签 + 内联创建新标签
- 版本历史：编辑用例后版本号递增 → 点击"版本历史"tab → 列表显示所有版本 → 点击查看某版本快照
- 删除用例 → 确认弹窗 → 用例从列表消失

---

### Phase 4: 计划管理 + 向计划添加/移除用例 ✅ 已完成

**目标**：完成计划的编辑删除，以及向计划添加用例的完整 UI。

**API Hooks 新增**：✅
- `api/plans.ts`：`useUpdatePlan(projectId)`, `useDeletePlan(projectId)` ✅
- `api/plan-cases.ts`：`useAddPlanCases(planId)`, `useAddPlanCasesByDirectory(planId)`, `useRemovePlanCase(planId)` ✅

**组件开发**：✅

`components/plan-form-dialog.tsx`：✅
- 创建/编辑计划共用表单 Dialog ✅
- 字段：name, description, startDate（date input）, endDate, status（Select）✅
- react-hook-form + `createPlanSchema` ✅

`components/add-cases-dialog.tsx`：✅
- 向计划添加用例的弹窗 ✅
- 步骤 1：选择用例库（下拉）✅
- 步骤 2：左侧目录树 + 右侧用例列表（含筛选），多选 checkbox ✅
- "添加选中项"按钮 → `useAddPlanCases` ✅

`components/add-by-directory-dialog.tsx`：✅
- 按目录批量添加弹窗 ✅
- 选择用例库 → 选择目录 → "递归子目录"checkbox（默认 true）✅
- 确认 → `useAddPlanCasesByDirectory` ✅

**页面改造**：✅

`pages/plans/plans-page.tsx`：✅
- "新建计划"改为按钮 → PlanFormDialog ✅
- 列表改用 Shadcn Table，显示 PlanStatusBadge ✅
- 每行添加编辑/删除操作 ✅

`pages/plans/plan-detail-page.tsx`：✅
- 头部添加"编辑计划"按钮 → PlanFormDialog 编辑模式 ✅
- 添加"添加用例"按钮 → AddCasesDialog ✅
- 添加"按目录添加"按钮 → AddByDirectoryDialog ✅
- 计划用例表每行添加"移除"按钮 → ConfirmDialog + `useRemovePlanCase` ✅
- 使用 PriorityBadge 等 Shadcn/ui 组件 ✅
- 迁移为 Shadcn/ui 组件 + Tailwind（卡片、Table、Sheet 历史抽屉）✅

**涉及文件**：✅
- 修改：`api/plans.ts`, `api/plan-cases.ts`, `plans-page.tsx`, `plan-detail-page.tsx` ✅
- 新建：`plan-form-dialog.tsx`, `add-cases-dialog.tsx`, `add-by-directory-dialog.tsx` ✅

**验证方式**：
- 编辑计划名称/描述/日期/状态 → 数据更新
- 删除计划 → 确认 → 计划消失
- 计划详情 → "添加用例" → 选择用例库 → 浏览并勾选用例 → 添加 → 用例出现在计划中（pending 状态）
- "按目录添加" → 选目录 → 勾选递归 → 添加 → 该目录下所有用例添加到计划
- "移除"某个计划用例 → 确认 → 用例从计划消失 → 统计更新
- 统计卡片、时间线、历史抽屉继续正常工作

---

### Phase 5: 已有页面迁移 + 整体打磨 ✅ 已完成

**目标**：将所有剩余使用自定义 CSS 的组件迁移到 Shadcn/ui + Tailwind，删除 `styles.css`，统一设计风格。

**具体工作**：

1. ~~迁移 `components/layout-shell.tsx` → Tailwind 布局 + Phosphor icons 导航~~ ✅
   - 完全重写为 Tailwind 布局，支持桌面端固定侧边栏 + 移动端抽屉式导航
   - 使用 Phosphor icons（Flask, Briefcase, Key, List, X）
   - 导航项高亮活跃路由，侧边栏底部添加 API 令牌入口
   - 移动端 hamburger 菜单 + overlay 背景 + 关闭按钮
   - 将 TokenModal 自动弹出逻辑（bootId 检查）从 App.tsx 移入 LayoutShell
2. ~~迁移 `components/token-modal.tsx` → Shadcn Dialog~~ ✅
   - 使用 Shadcn Dialog + Button 组件重写
   - 添加复制令牌反馈（Check icon + "已复制"状态）
   - 令牌展示区域使用 monospace 字体 + 可全选
3. ~~删除 `apps/web/src/styles.css`，更新 `main.tsx` 只导入 `globals.css`~~ ✅
   - `globals.css` 吸收了字体导入（Space Grotesk + IBM Plex Mono）、body 背景渐变、链接默认样式
   - 新增 `--sidebar-bg` CSS 变量
4. ~~审查所有页面，确保无残留的自定义 CSS class 引用~~ ✅
   - 清理 `directory-node.tsx` 中无效的 `directory-node-group` class
   - 全部页面、组件已通过代码审查（无旧 CSS 类/变量残留）
5. ~~统一 Loading 和 Error 状态展示（Loading spinner 组件替代 "Loading..." 文本）~~ ✅
   - 新建 `components/loading-spinner.tsx`（支持 sm/md/lg 尺寸 + 可选 label）
   - 5 个页面的主要 loading 状态替换为 LoadingSpinner
6. ~~响应式适配检查~~ ✅
   - LayoutShell 支持 `lg:` 断点自适应（桌面端侧边栏 / 移动端抽屉）
   - 所有原生 `<input type="checkbox">` 替换为 Shadcn Checkbox（含 plan-detail-page、add-cases-dialog、add-by-directory-dialog）
   - 新建 `components/ui/checkbox.tsx` 基于 Radix Checkbox
   - `pnpm build` 成功通过，无 TS 错误
7. ~~App.tsx 简化~~ ✅
   - 移除 `useTokenModalState` hook 和 `TokenModal` 渲染（已移入 LayoutShell）

**涉及文件**：
- 修改：`layout-shell.tsx`, `token-modal.tsx`, `main.tsx`, `App.tsx`, `globals.css`, `plan-detail-page.tsx`, `add-cases-dialog.tsx`, `add-by-directory-dialog.tsx`, `directory-node.tsx`, `projects-page.tsx`, `project-detail-page.tsx`, `plans-page.tsx`, `library-cases-page.tsx`
- 新建：`loading-spinner.tsx`, `ui/checkbox.tsx`
- 删除：`styles.css`

**验证方式**：
- ~~全部页面视觉一致，无样式错乱~~ ✅
- ~~`pnpm build` 成功，无 TS 错误~~ ✅
- ~~移动端视口下布局合理（LayoutShell 抽屉式导航）~~ ✅
- 完整端到端流程：创建项目 → 创建用例库 → 创建目录 → 创建用例（文本+步骤）→ 打标签 → 创建计划 → 添加用例到计划 → 执行测试（标记通过/失败）→ 查看统计 → 查看历史

---

## 三、阶段依赖关系

```
Phase 0 (基础设施)
    │
    ▼
Phase 1 (项目 + 用例库 CRUD)
    │
    ▼
Phase 2 (目录树 + 标签)
    │
    ▼
Phase 3 (用例 CRUD + 筛选 + 详情 + 版本)
    │
    ▼
Phase 4 (计划管理 + 添加/移除用例)
    │
    ▼
Phase 5 (迁移 + 打磨)
```

Phase 0 必须最先完成。Phase 1-4 顺序执行（每个阶段依赖前一个的组件/hooks）。Phase 5 可以在任何阶段之后穿插执行，但建议放到最后统一处理。

## 四、工作量概估

| 阶段 | 新建文件 | 修改文件 | 核心复杂度 |
|---|---|---|---|
| Phase 0 | ~25 | ~6 | 低（配置为主） |
| Phase 1 | 0 | 4 | 低 |
| Phase 2 | 7 | 1 | 中（目录树递归渲染） |
| Phase 3 | 7 | 2 | **高**（表单 + 步骤编辑器 + 筛选联动） |
| Phase 4 | 3 | 4 | 中（复用 Phase 2/3 组件） |
| Phase 5 | 1 | 3 + 删除 1 | 低（样式迁移） |
