# TestHub 项目文档

## 项目概述

TestHub 是一个 **local-first（本地优先）** 的轻量测试管理工具，用于替代云效测试管理的核心能力，解决其 API 开放不足导致的"无法自动化同步用例与测试计划"的问题。

**核心价值：**
- 提供完整的本地 REST API，支持 coding agent / 脚本自动创建用例和测试计划
- 提供 Web UI 供人工执行测试和标记结果
- 数据本地存储（SQLite），单机使用，零配置

**技术栈：**
- Monorepo: pnpm + Turborepo
- 后端: Fastify + TypeScript + Drizzle + better-sqlite3 + Zod + @fastify/swagger
- 前端: React + TypeScript + Vite + Shadcn/ui + Tailwind CSS + TanStack Query + React Router v6

---

## 需求文档

### 核心功能（Core）
> TestHub 的核心测试管理功能

**活跃需求：**
- [TestHub - 本地优先测试管理系统](requirements/core/test-management-system.md) - v1.0.0（开发中）
  - 包含项目管理、用例库管理、测试用例管理、测试计划管理四大核心功能

---

## 技术文档

- [CLAUDE.md](../CLAUDE.md) - 项目技术规范和编码约定
- [README.md](../README.md) - 项目说明和快速开始
- [.claude/plans/hidden-cuddling-octopus.md](../.claude/plans/hidden-cuddling-octopus.md) - 详细设计方案

---

## 快速开始

### 安装依赖
```bash
pnpm install
```

### 开发模式
```bash
pnpm dev
```
- 前端：http://localhost:5173
- 后端 API：http://localhost:3000/api/v1
- Swagger UI：http://localhost:3000/api/docs

### 生产构建
```bash
pnpm build
pnpm start
```

### 数据库操作
```bash
pnpm db:generate   # 生成 migration
pnpm db:migrate    # 执行 migration
```

---

## API 文档

启动服务后访问 Swagger UI：http://localhost:3000/api/docs

**API 前缀：** `/api/v1`

**主要端点：**
- Projects: `/projects`
- Libraries: `/projects/:projectId/libraries`, `/libraries/:id`
- Directories: `/libraries/:libraryId/directories`, `/directories/:id`
- Cases: `/libraries/:libraryId/cases`, `/cases/:id`
- Tags: `/libraries/:libraryId/tags`, `/tags/:id`
- Plans: `/projects/:projectId/plans`, `/plans/:id`
- Plan Cases: `/plans/:planId/cases`

---

## 数据模型

9 张表：projects, libraries, directories, cases, case_steps, tags, case_tags, plans, plan_cases

详见 [需求文档 - 数据模型章节](requirements/core/test-management-system.md#数据模型)

---

## 常见问题

### Q: 如何备份数据？
A: 复制 `apps/server/data/testhub.db` 文件即可备份所有数据。

### Q: 如何通过 API 批量创建用例？
A: 调用 `POST /api/v1/libraries/:libraryId/cases/batch`，请求体为用例对象数组。详见 Swagger UI。

### Q: 测试计划如何统计通过率？
A: 访问 `GET /api/v1/plans/:planId/stats` 获取统计数据，包含各状态数量、占比和通过率。

---

## 更新日志

### v1.0.0（开发中） - 2026-02-09
- 初始版本
- 完成核心功能设计：项目管理、用例库管理、测试用例管理、测试计划管理
- 完成技术栈选型和 Monorepo 架构设计
