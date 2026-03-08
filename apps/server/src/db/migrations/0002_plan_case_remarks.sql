-- 暂时关闭外键检查以便重建表
PRAGMA foreign_keys = OFF;

-- 删除 plan_cases.remark 列（SQLite 需要重建表）
CREATE TABLE plan_cases_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id INTEGER NOT NULL,
  case_id INTEGER NOT NULL,
  case_version_id INTEGER NOT NULL,
  execution_status TEXT NOT NULL DEFAULT 'pending',
  executed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(plan_id) REFERENCES plans(id) ON DELETE CASCADE,
  FOREIGN KEY(case_id) REFERENCES cases(id) ON DELETE RESTRICT,
  FOREIGN KEY(case_version_id) REFERENCES case_versions(id) ON DELETE RESTRICT
);

INSERT INTO plan_cases_new (id, plan_id, case_id, case_version_id, execution_status, executed_at, created_at, updated_at)
  SELECT id, plan_id, case_id, case_version_id, execution_status, executed_at, created_at, updated_at FROM plan_cases;

DROP TABLE plan_cases;
ALTER TABLE plan_cases_new RENAME TO plan_cases;
CREATE UNIQUE INDEX idx_plan_cases_plan_case ON plan_cases(plan_id, case_id);

-- 重新开启外键检查
PRAGMA foreign_keys = ON;

-- 新增 plan_case_remarks 表
CREATE TABLE IF NOT EXISTS plan_case_remarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_case_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(plan_case_id) REFERENCES plan_cases(id) ON DELETE CASCADE
);
