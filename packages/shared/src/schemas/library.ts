import { z } from "zod";
import { buildPaginatedResponseSchema, isoDateTimeSchema, pageQuerySchema } from "./common";

export const createLibrarySchema = z.object({
  name: z.string().min(1, { message: "请填写名称" }).max(120, { message: "名称最多 120 个字符" }),
  code: z.string().regex(/^[A-Z0-9]{4}$/, { message: "标识码须为 4 位大写字母或数字" }),
  description: z.string().max(2000, { message: "描述最多 2000 个字符" }).optional()
});

export const updateLibrarySchema = createLibrarySchema.partial().refine((data) => Object.keys(data).length > 0, {
  message: "至少需要填写一项"
});

export const librarySchema = z.object({
  id: z.number().int().positive(),
  projectId: z.number().int().positive(),
  name: z.string(),
  code: z.string(),
  description: z.string().nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema
});

export const libraryListQuerySchema = pageQuerySchema.extend({
  sortBy: z.enum(["createdAt", "updatedAt", "name", "code"]).default("updatedAt")
});

export const libraryListResponseSchema = buildPaginatedResponseSchema(librarySchema);
