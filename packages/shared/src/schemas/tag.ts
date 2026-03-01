import { z } from "zod";
import { buildPaginatedResponseSchema, isoDateTimeSchema, pageQuerySchema } from "./common";

export const createTagSchema = z.object({
  name: z.string().min(1, { message: "请填写标签名称" }).max(64, { message: "标签名称最多 64 个字符" })
});

export const tagSchema = z.object({
  id: z.number().int().positive(),
  libraryId: z.number().int().positive(),
  name: z.string(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema
});

export const tagListQuerySchema = pageQuerySchema.extend({
  sortBy: z.enum(["createdAt", "updatedAt", "name"]).default("name")
});

export const tagListResponseSchema = buildPaginatedResponseSchema(tagSchema);
