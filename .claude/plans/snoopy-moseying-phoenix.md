# v1.1.0 开发计划：项目全局上下文切换器重构

## Context

v1.0.0 的导航模式是「项目列表 → 项目详情 → 用例库/测试计划」层级跳转。实际使用中，用户通常只有 2-3 个项目且集中在同一项目工作，层级导航增加了不必要的跳转。

v1.1.0 将项目改为**全局上下文切换器**，侧边栏顶部下拉切换项目，用例库和测试计划作为常驻导航，减少跳转层级。

**改动范围**：纯前端重构，后端 API 无需变更。

---

## 阶段一：创建项目上下文 (ProjectContext) — ✅ 已完成 (2026-03-07)

**目标**：建立全局项目选择状态，含 localStorage 持久化和自动选中逻辑。

### 新建文件

1. **`apps/web/src/contexts/project-context.tsx`** ✅
   - 创建 `ProjectContext` + `ProjectProvider`
   - 状态：`currentProjectId: number | null`
   - 使用已有 `useProjects()` hook 获取项目列表
   - localStorage key: `testhub.currentProjectId`
   - 初始化：localStorage 有值且有效 → 使用；否则自动选中第一个项目；无项目 → null
   - 暴露接口：
     ```typescript
     interface ProjectContextValue {
       currentProjectId: number | null;
       currentProject: Project | null;
       projects: Project[];
       isLoading: boolean;
       switchProject: (id: number) => void;
     }
     ```
   - `switchProject` 同时更新 state 和 localStorage

2. **`apps/web/src/hooks/use-current-project.ts`** ✅
   - 封装 `useContext(ProjectContext)` + 空值检查

### 修改文件

3. **`apps/web/src/App.tsx`** ✅
   - 在 `<Routes>` 外包裹 `<ProjectProvider>`

### 验证
- `pnpm typecheck` 通过（无新增类型错误）
- React DevTools 检查 Context 值正确 — 待手动验证
- 刷新页面后 localStorage `testhub.currentProjectId` 保持 — 待手动验证

### 实施记录
- **已有问题**：`apps/web/src/__tests__/lib/runtime.test.ts` 存在 `beforeEach` 未使用的类型错误（TS6133），与本次改动无关，属于之前遗留
- **实现细节**：`useProjects()` 返回 `Paginated<Project>`，通过 `data?.items ?? []` 获取项目数组
- **Provider 位置**：放在 `App.tsx` 的 `<Routes>` 外层（`BrowserRouter` 在 `main.tsx` 中，已在其内部）

### 阶段二前置条件（新发现）
- 阶段二需要检查 `layout-shell.tsx` 当前的导航结构和 `navItems` 定义，理解现有侧边栏布局
- 阶段二需要检查 `useLibraries(projectId)` 的 API（在 `apps/web/src/api/libraries.ts`），确认参数签名和返回类型
- 阶段二需要确认 shadcn/ui 的 `Command` 组件是否已安装（`Popover` 已确认可用），如未安装需先 `npx shadcn@latest add command`
- 阶段二需要从 `project-detail-page.tsx` 提取 `LibraryFormDialog`，需先阅读该文件了解组件结构和依赖

---

## 阶段二：重构侧边栏 + 项目切换器 — ✅ 已完成 (2026-03-07)

**目标**：侧边栏顶部加项目切换器，中部加用例库列表和测试计划导航。

### 新建文件

1. **`apps/web/src/components/project-switcher.tsx`** ✅
   - 使用 shadcn/ui `Popover` + 自定义列表（未使用 `Command`，因项目无 `components.json`，shadcn CLI 不可用）
   - 触发器：当前项目名 + CaretUpDown 图标
   - 弹出层：项目列表（Check 标记当前项）+ 底部「管理项目」链接 → `/projects`
   - 无项目时显示引导创建提示
   - 使用 `useCurrentProject()` 获取数据和切换方法

2. **`apps/web/src/components/library-form-dialog.tsx`** ✅（额外新建）
   - 从 `project-detail-page.tsx` 提取的独立组件
   - `project-detail-page.tsx` 已改为 import 此组件

### 修改文件

3. **`apps/web/src/components/layout-shell.tsx`** ✅ — 核心变更
   - Brand 区下方插入 `<ProjectSwitcher />`
   - 删除原有静态 `navItems` 数组
   - 导航区改为两个动态分组：用例库列表 + 测试计划链接
   - 高亮逻辑：匹配当前 URL pathname
   - `currentProjectId` 为 null 时显示空状态引导
   - 保留底部 API 令牌按钮不变
   - 侧边栏内集成 `LibraryFormDialog`，供 "+" 按钮触发

4. **`apps/web/src/pages/projects/project-detail-page.tsx`** ✅
   - 删除内联 `LibraryFormDialog` 定义，改为 import 独立组件
   - 清理无用 import（`zodResolver`, `createLibrarySchema`, `CreateLibraryInput`）

5. **`apps/web/src/__tests__/lib/runtime.test.ts`** ✅（额外修复）
   - 移除未使用的 `beforeEach` import，修复 TS6133 错误

### 验证
- `pnpm typecheck` 全部通过（0 错误）
- 切换项目后侧边栏用例库列表动态刷新 — 待手动验证
- 点击用例库/测试计划正确跳转 — 待手动验证
- 移动端响应式正常 — 待手动验证
- 侧边栏 "+" 可新建用例库 — 待手动验证

### 实施记录
- **shadcn CLI 不可用**：项目根目录和 `apps/web` 均无 `components.json`，shadcn CLI 要求初始化。已有的 UI 组件（Popover、Dialog 等）是之前手动添加的。因此切换器使用 `Popover` + 自定义列表替代 `Command` 组件
- **额外提取**：将 `LibraryFormDialog` 提取为 `components/library-form-dialog.tsx` 独立组件，供侧边栏和 project-detail-page 共用
- **`useLibraries` 注意**：`useLibraries(projectId)` 的 `enabled` 条件为 `Number.isFinite(projectId)`，当 `currentProjectId` 为 `null` 时传入 `0` 会导致查询触发（0 是 finite），但服务端无 projectId=0 的数据所以返回空结果。后续可考虑在 `currentProjectId` 为 `null` 时不调用

### 阶段三前置条件（新发现）
- 阶段三需删除 `project-detail-page.tsx` 文件，但其中 `EditProjectDialog` 组件在 `projects-page.tsx` 是否有同等功能需要先确认
- 阶段三需修改 `projects-page.tsx` 添加用例库管理区，需先阅读该文件了解当前结构

---

## 阶段三：路由重构 + 页面适配 — ✅ 已完成 (2026-03-07)

**目标**：删除项目详情页路由，调整各页面的导航链接。

### 删除文件

1. **`apps/web/src/pages/projects/project-detail-page.tsx`** ✅ 已删除

### 修改文件

2. **`apps/web/src/App.tsx`** ✅
   - 删除 `ProjectDetailPage` import 和 `/projects/:projectId` 路由

3. **`apps/web/src/pages/projects/projects-page.tsx`** ✅
   - 项目名称列：`<Link>` → `<button>` 调用 `switchProject`，当前选中项目行高亮
   - 新增用例库管理区：项目表格下方展示当前项目的用例库列表，含增删改全套功能
   - 删除当前项目后：由 `ProjectContext` 自动切换到第一个可用项目

4. **`apps/web/src/pages/libraries/library-cases-page.tsx`** ✅
   - 删除返回按钮（ArrowLeft + Link）
   - 移除无用的 `projectId` 变量和 `Link`、`ArrowLeft` import

5. **`apps/web/src/pages/plans/plans-page.tsx`** ✅
   - 删除返回按钮（ArrowLeft + Link）
   - 移除无用的 `ArrowLeft` import

### 验证
- `pnpm typecheck` 全部通过（0 错误）
- 访问 `/projects/:projectId` 不再匹配路由
- 各页面无"返回项目"按钮
- `/projects` 管理页可管理用例库 — 待手动验证

### 实施记录
- **`EditProjectDialog` 确认**：`projects-page.tsx` 原有 `ProjectFormDialog` 已同时支持创建和编辑，无需从 project-detail-page 迁移
- **自动切换**：删除当前项目后，`ProjectContext` 的 `useEffect` 检测到 `selectedId` 不在 `projects` 列表中会自动切换到第一个可用项目

### 阶段四前置条件（新发现）
- 阶段四需要修改 `project-switcher.tsx` 添加切换时的页面跳转逻辑，需使用 `useNavigate` 和 `useLocation`
- 阶段四需要修改 `project-context.tsx` 添加 URL 同步逻辑，但 Context 中目前未使用路由 hooks，需要评估是否在 Context 内引入 `useLocation`（可能导致整棵组件树在路由变化时重渲染）

---

## 阶段四：项目切换跳转 + URL 同步 — ✅ 已完成 (2026-03-07)

**目标**：切换项目时自动跳转，深链接 URL 能同步 Context。

### 修改文件

1. **`apps/web/src/components/project-switcher.tsx`** ✅
   - 添加 `useLocation` + `useNavigate`
   - 切换项目时判断当前页面：
     - 在 `/projects` 管理页 → 不跳转
     - 在其他项目的子页面 → 跳转到新项目的测试计划页 `/projects/:newId/plans`

2. **`apps/web/src/contexts/project-context.tsx`** ✅
   - 新增 `ProjectUrlSync` 独立组件（放在 Provider 内部，避免 `useLocation` 导致整棵树重渲染）
   - 通过正则 `/^\/projects\/(\d+)\//` 从 URL 解析 projectId
   - 解析到有效 projectId 且与当前不同时，自动调用 `switchProject`

3. **`apps/web/src/pages/projects/projects-page.tsx`** ✅
   - 创建项目的 `onSuccess` 回调中调用 `switchProject(newProject.id)` 自动切换

### 验证
- `pnpm typecheck` 全部通过（0 错误）
- 在用例库页面切换项目 → 跳转到新项目默认页 — 待手动验证
- 在 `/projects` 切换项目 → 不跳转，侧边栏刷新 — 待手动验证
- 直接访问深链接 → Context 自动同步 — 待手动验证
- 创建第一个项目 → 自动选中 — 待手动验证

### 实施记录
- **URL 同步方案**：未在 `ProjectProvider` 内部直接使用 `useLocation`，而是创建独立的 `ProjectUrlSync` 子组件渲染在 Provider 内部，仅该组件在路由变化时重渲染
- **创建项目自动切换**：利用 `useMutation` 的 `onSuccess` 回调接收返回的 `Project` 对象，直接取 `newProject.id` 调用 `switchProject`

---

## 阶段五：收尾验证 — ✅ 已完成 (2026-03-07)

1. `pnpm typecheck` 通过 ✅
2. `pnpm build` 通过 ✅
3. `pnpm test` 通过 ✅（shared 124 + server 74 + web 46 = 244 tests）
4. 手动测试全流程（待手动验证）：
   - 全新启动（无项目）→ 引导创建 → 自动选中
   - 创建多个项目 → 切换项目 → 侧边栏数据正确
   - 在各页面间导航 → 高亮正确
   - 刷新页面 → 项目选中状态保持
   - 删除当前项目 → 自动切回其他项目
   - 深链接访问 → Context 同步

---

## 文件变更汇总

| 操作 | 文件 | 说明 |
|------|------|------|
| 新建 | `apps/web/src/contexts/project-context.tsx` | 项目全局上下文 |
| 新建 | `apps/web/src/hooks/use-current-project.ts` | 便捷 hook |
| 新建 | `apps/web/src/components/project-switcher.tsx` | 项目切换器组件 |
| 大改 | `apps/web/src/components/layout-shell.tsx` | 侧边栏重构（核心） |
| 改 | `apps/web/src/App.tsx` | 删除详情页路由，加 Provider |
| 改 | `apps/web/src/pages/projects/projects-page.tsx` | 项目名行为 + 用例库管理 |
| 改 | `apps/web/src/pages/libraries/library-cases-page.tsx` | 删返回按钮 |
| 改 | `apps/web/src/pages/plans/plans-page.tsx` | 删返回按钮 |
| 删 | `apps/web/src/pages/projects/project-detail-page.tsx` | 职责迁移到侧边栏+管理页 |

## 关键复用

- `useProjects()` — `apps/web/src/api/projects.ts`
- `useLibraries(projectId)` — `apps/web/src/api/libraries.ts`（含 CRUD mutations）
- `LibraryFormDialog` — 从 `project-detail-page.tsx` 提取到独立组件或内联到 layout-shell
- shadcn/ui 组件：`Popover`, `Command`, `Dialog` 等已安装可用
