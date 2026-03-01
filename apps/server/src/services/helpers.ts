import type { InferSelectModel } from "drizzle-orm";
import {
  caseSteps,
  caseVersions,
  cases,
  directories,
  libraries,
  planCaseStatusHistories,
  planCases,
  plans,
  projects,
  tags
} from "../db/schema";

export type ProjectRow = InferSelectModel<typeof projects>;
export type LibraryRow = InferSelectModel<typeof libraries>;
export type DirectoryRow = InferSelectModel<typeof directories>;
export type CaseRow = InferSelectModel<typeof cases>;
export type CaseStepRow = InferSelectModel<typeof caseSteps>;
export type CaseVersionRow = InferSelectModel<typeof caseVersions>;
export type TagRow = InferSelectModel<typeof tags>;
export type PlanRow = InferSelectModel<typeof plans>;
export type PlanCaseRow = InferSelectModel<typeof planCases>;
export type PlanCaseStatusHistoryRow = InferSelectModel<typeof planCaseStatusHistories>;

export interface CaseStepPayload {
  stepOrder: number;
  action: string;
  expected?: string;
}

export function parseStepsJson(value: string): CaseStepPayload[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    const result: CaseStepPayload[] = [];
    for (const entry of parsed) {
      if (!entry || typeof entry !== "object") {
        continue;
      }

      const item = entry as { stepOrder?: unknown; action?: unknown; expected?: unknown };
      if (typeof item.stepOrder !== "number" || typeof item.action !== "string") {
        continue;
      }

      result.push({
        stepOrder: item.stepOrder,
        action: item.action,
        expected: typeof item.expected === "string" ? item.expected : undefined
      });
    }

    return result;
  } catch {
    return [];
  }
}

export function parseTagsJson(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((entry): entry is string => typeof entry === "string");
  } catch {
    return [];
  }
}
