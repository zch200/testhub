PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS libraries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_libraries_project_code ON libraries(project_id, code);

CREATE TABLE IF NOT EXISTS directories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  library_id INTEGER NOT NULL,
  parent_id INTEGER,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(library_id) REFERENCES libraries(id) ON DELETE CASCADE,
  FOREIGN KEY(parent_id) REFERENCES directories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS cases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  library_id INTEGER NOT NULL,
  directory_id INTEGER,
  latest_version_no INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  precondition TEXT,
  content_type TEXT NOT NULL DEFAULT 'text',
  text_content TEXT,
  text_expected TEXT,
  priority TEXT NOT NULL DEFAULT 'P1',
  case_type TEXT NOT NULL DEFAULT 'functional',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(library_id) REFERENCES libraries(id) ON DELETE CASCADE,
  FOREIGN KEY(directory_id) REFERENCES directories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS case_steps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER NOT NULL,
  step_order INTEGER NOT NULL,
  action TEXT NOT NULL,
  expected TEXT,
  FOREIGN KEY(case_id) REFERENCES cases(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_case_steps_case_order ON case_steps(case_id, step_order);

CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  library_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(library_id) REFERENCES libraries(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_library_name ON tags(library_id, name);

CREATE TABLE IF NOT EXISTS case_tags (
  case_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY(case_id, tag_id),
  FOREIGN KEY(case_id) REFERENCES cases(id) ON DELETE CASCADE,
  FOREIGN KEY(tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS case_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER NOT NULL,
  version_no INTEGER NOT NULL,
  title TEXT NOT NULL,
  precondition TEXT,
  content_type TEXT NOT NULL,
  text_content TEXT,
  text_expected TEXT,
  priority TEXT NOT NULL,
  case_type TEXT NOT NULL,
  steps_json TEXT NOT NULL,
  tags_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(case_id) REFERENCES cases(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_case_versions_case_version ON case_versions(case_id, version_no);

CREATE TABLE IF NOT EXISTS plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  start_date TEXT,
  end_date TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS plan_cases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id INTEGER NOT NULL,
  case_id INTEGER NOT NULL,
  case_version_id INTEGER NOT NULL,
  execution_status TEXT NOT NULL DEFAULT 'pending',
  remark TEXT,
  executed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(plan_id) REFERENCES plans(id) ON DELETE CASCADE,
  FOREIGN KEY(case_id) REFERENCES cases(id) ON DELETE RESTRICT,
  FOREIGN KEY(case_version_id) REFERENCES case_versions(id) ON DELETE RESTRICT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_plan_cases_plan_case ON plan_cases(plan_id, case_id);

CREATE TABLE IF NOT EXISTS plan_case_status_histories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_case_id INTEGER NOT NULL,
  plan_id INTEGER NOT NULL,
  case_id INTEGER NOT NULL,
  from_execution_status TEXT,
  to_execution_status TEXT NOT NULL,
  from_case_version_id INTEGER,
  to_case_version_id INTEGER,
  reason_type TEXT NOT NULL,
  reason_note TEXT,
  actor TEXT NOT NULL,
  source TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(plan_case_id) REFERENCES plan_cases(id) ON DELETE CASCADE,
  FOREIGN KEY(plan_id) REFERENCES plans(id) ON DELETE CASCADE,
  FOREIGN KEY(case_id) REFERENCES cases(id) ON DELETE RESTRICT,
  FOREIGN KEY(from_case_version_id) REFERENCES case_versions(id) ON DELETE SET NULL,
  FOREIGN KEY(to_case_version_id) REFERENCES case_versions(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_history_plan_case_created_at ON plan_case_status_histories(plan_case_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_history_plan_created_at ON plan_case_status_histories(plan_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_history_case_created_at ON plan_case_status_histories(case_id, created_at DESC);
