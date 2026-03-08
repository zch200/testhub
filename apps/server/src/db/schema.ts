import { index, integer, primaryKey, sqliteTable, text, uniqueIndex, type AnySQLiteColumn } from "drizzle-orm/sqlite-core";

export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
});

export const libraries = sqliteTable(
  "libraries",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    code: text("code").notNull(),
    description: text("description"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull()
  },
  (table) => ({
    projectCodeUnique: uniqueIndex("idx_libraries_project_code").on(table.projectId, table.code)
  })
);

export const directories = sqliteTable("directories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  libraryId: integer("library_id")
    .notNull()
    .references(() => libraries.id, { onDelete: "cascade" }),
  parentId: integer("parent_id").references((): AnySQLiteColumn => directories.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
});

export const cases = sqliteTable("cases", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  libraryId: integer("library_id")
    .notNull()
    .references(() => libraries.id, { onDelete: "cascade" }),
  directoryId: integer("directory_id").references(() => directories.id, { onDelete: "set null" }),
  latestVersionNo: integer("latest_version_no").notNull().default(1),
  title: text("title").notNull(),
  precondition: text("precondition"),
  contentType: text("content_type").notNull().default("text"),
  textContent: text("text_content"),
  textExpected: text("text_expected"),
  priority: text("priority").notNull().default("P1"),
  caseType: text("case_type").notNull().default("functional"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
});

export const caseSteps = sqliteTable(
  "case_steps",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    caseId: integer("case_id")
      .notNull()
      .references(() => cases.id, { onDelete: "cascade" }),
    stepOrder: integer("step_order").notNull(),
    action: text("action").notNull(),
    expected: text("expected")
  },
  (table) => ({
    caseOrderUnique: uniqueIndex("idx_case_steps_case_order").on(table.caseId, table.stepOrder)
  })
);

export const tags = sqliteTable(
  "tags",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    libraryId: integer("library_id")
      .notNull()
      .references(() => libraries.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull()
  },
  (table) => ({
    libraryTagUnique: uniqueIndex("idx_tags_library_name").on(table.libraryId, table.name)
  })
);

export const caseTags = sqliteTable(
  "case_tags",
  {
    caseId: integer("case_id")
      .notNull()
      .references(() => cases.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" })
  },
  (table) => ({
    pk: primaryKey({ columns: [table.caseId, table.tagId], name: "pk_case_tags" })
  })
);

export const caseVersions = sqliteTable(
  "case_versions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    caseId: integer("case_id")
      .notNull()
      .references(() => cases.id, { onDelete: "cascade" }),
    versionNo: integer("version_no").notNull(),
    title: text("title").notNull(),
    precondition: text("precondition"),
    contentType: text("content_type").notNull(),
    textContent: text("text_content"),
    textExpected: text("text_expected"),
    priority: text("priority").notNull(),
    caseType: text("case_type").notNull(),
    stepsJson: text("steps_json").notNull(),
    tagsJson: text("tags_json").notNull(),
    createdAt: text("created_at").notNull()
  },
  (table) => ({
    caseVersionUnique: uniqueIndex("idx_case_versions_case_version").on(table.caseId, table.versionNo)
  })
);

export const plans = sqliteTable("plans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  status: text("status").notNull().default("draft"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
});

export const planCases = sqliteTable(
  "plan_cases",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    planId: integer("plan_id")
      .notNull()
      .references(() => plans.id, { onDelete: "cascade" }),
    caseId: integer("case_id")
      .notNull()
      .references(() => cases.id, { onDelete: "restrict" }),
    caseVersionId: integer("case_version_id")
      .notNull()
      .references(() => caseVersions.id, { onDelete: "restrict" }),
    executionStatus: text("execution_status").notNull().default("pending"),
    executedAt: text("executed_at"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull()
  },
  (table) => ({
    planCaseUnique: uniqueIndex("idx_plan_cases_plan_case").on(table.planId, table.caseId)
  })
);

export const planCaseRemarks = sqliteTable("plan_case_remarks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  planCaseId: integer("plan_case_id")
    .notNull()
    .references(() => planCases.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull()
});

export const planCaseStatusHistories = sqliteTable(
  "plan_case_status_histories",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    planCaseId: integer("plan_case_id")
      .notNull()
      .references(() => planCases.id, { onDelete: "cascade" }),
    planId: integer("plan_id")
      .notNull()
      .references(() => plans.id, { onDelete: "cascade" }),
    caseId: integer("case_id")
      .notNull()
      .references(() => cases.id, { onDelete: "restrict" }),
    fromExecutionStatus: text("from_execution_status"),
    toExecutionStatus: text("to_execution_status").notNull(),
    fromCaseVersionId: integer("from_case_version_id").references(() => caseVersions.id, { onDelete: "set null" }),
    toCaseVersionId: integer("to_case_version_id").references(() => caseVersions.id, { onDelete: "set null" }),
    reasonType: text("reason_type").notNull(),
    reasonNote: text("reason_note"),
    actor: text("actor").notNull(),
    source: text("source").notNull(),
    createdAt: text("created_at").notNull()
  },
  (table) => ({
    planCaseCreatedAtIdx: index("idx_history_plan_case_created_at").on(table.planCaseId, table.createdAt),
    planCreatedAtIdx: index("idx_history_plan_created_at").on(table.planId, table.createdAt),
    caseCreatedAtIdx: index("idx_history_case_created_at").on(table.caseId, table.createdAt)
  })
);
