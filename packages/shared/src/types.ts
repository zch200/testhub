import type { z } from "zod";
import type { executionStatuses, planStatuses, historyReasonTypes, historySources } from "./schemas";
import type {
  createProjectSchema,
  updateProjectSchema,
  projectSchema,
  createLibrarySchema,
  updateLibrarySchema,
  librarySchema,
  createDirectorySchema,
  updateDirectorySchema,
  directorySchema,
  createCaseSchema,
  updateCaseSchema,
  batchCreateCaseSchema,
  caseSchema,
  caseVersionSchema,
  createTagSchema,
  tagSchema,
  createPlanSchema,
  updatePlanSchema,
  planSchema,
  createPlanCasesSchema,
  addPlanCasesByDirectorySchema,
  updatePlanCaseSchema,
  batchUpdatePlanCaseStatusSchema,
  planCaseSchema,
  planCaseStatusHistorySchema
} from "./schemas";

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type Project = z.infer<typeof projectSchema>;

export type CreateLibraryInput = z.infer<typeof createLibrarySchema>;
export type UpdateLibraryInput = z.infer<typeof updateLibrarySchema>;
export type Library = z.infer<typeof librarySchema>;

export type CreateDirectoryInput = z.infer<typeof createDirectorySchema>;
export type UpdateDirectoryInput = z.infer<typeof updateDirectorySchema>;
export type Directory = z.infer<typeof directorySchema>;

export type CreateCaseInput = z.infer<typeof createCaseSchema>;
export type UpdateCaseInput = z.infer<typeof updateCaseSchema>;
export type BatchCreateCaseInput = z.infer<typeof batchCreateCaseSchema>;
export type Case = z.infer<typeof caseSchema>;
export type CaseVersion = z.infer<typeof caseVersionSchema>;

export type CreateTagInput = z.infer<typeof createTagSchema>;
export type Tag = z.infer<typeof tagSchema>;

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
export type Plan = z.infer<typeof planSchema>;

export type CreatePlanCasesInput = z.infer<typeof createPlanCasesSchema>;
export type AddPlanCasesByDirectoryInput = z.infer<typeof addPlanCasesByDirectorySchema>;
export type UpdatePlanCaseInput = z.infer<typeof updatePlanCaseSchema>;
export type BatchUpdatePlanCaseStatusInput = z.infer<typeof batchUpdatePlanCaseStatusSchema>;
export type PlanCase = z.infer<typeof planCaseSchema>;
export type PlanCaseStatusHistory = z.infer<typeof planCaseStatusHistorySchema>;

export type ExecutionStatus = (typeof executionStatuses)[number];
export type PlanStatus = (typeof planStatuses)[number];
export type HistoryReasonType = (typeof historyReasonTypes)[number];
export type HistorySource = (typeof historySources)[number];
