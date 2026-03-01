export const casePriorities = ["P0", "P1", "P2", "P3"] as const;
export const caseContentTypes = ["text", "step"] as const;
export const caseTypes = ["functional", "performance", "api", "ui", "other"] as const;
export const planStatuses = ["draft", "in_progress", "completed", "archived"] as const;
export const executionStatuses = ["pending", "passed", "failed", "blocked", "skipped"] as const;
export const sortOrders = ["asc", "desc"] as const;

export const historyReasonTypes = [
  "manual_update",
  "batch_update",
  "case_version_sync",
  "plan_case_created",
  "system_update"
] as const;

export const historySources = ["api", "ui", "system"] as const;
