import { z } from "zod";
import { buildPaginatedResponseSchema, isoDateTimeSchema, pageQuerySchema } from "./common";

export const createProjectSchema = z.object({
  name: z.string().min(1, { message: "请填写名称" }).max(120, { message: "名称最多 120 个字符" }),
  description: z.string().max(2000, { message: "描述最多 2000 个字符" }).optional()
});

export const updateProjectSchema = createProjectSchema.partial().refine((data) => Object.keys(data).length > 0, {
  message: "至少需要填写一项"
});

export const projectSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  description: z.string().nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema
});

export const projectListQuerySchema = pageQuerySchema.extend({
  sortBy: z.enum(["createdAt", "updatedAt", "name"]).default("updatedAt")
});

export const projectListResponseSchema = buildPaginatedResponseSchema(projectSchema);
