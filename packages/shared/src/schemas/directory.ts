import { z } from "zod";
import { buildPaginatedResponseSchema, isoDateTimeSchema, pageQuerySchema } from "./common";

export const createDirectorySchema = z.object({
  parentId: z.number().int().positive().nullable().optional(),
  name: z.string().min(1, { message: "请填写名称" }).max(120, { message: "名称最多 120 个字符" }),
  sortOrder: z.number().int().nonnegative().default(0)
});

export const updateDirectorySchema = z
  .object({
    parentId: z.number().int().positive().nullable().optional(),
    name: z.string().min(1, { message: "请填写名称" }).max(120, { message: "名称最多 120 个字符" }).optional(),
    sortOrder: z.number().int().nonnegative().optional()
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "至少需要填写一项"
  });

export const directorySchema = z.object({
  id: z.number().int().positive(),
  libraryId: z.number().int().positive(),
  parentId: z.number().int().positive().nullable(),
  name: z.string(),
  sortOrder: z.number().int().nonnegative(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema
});

export type DirectoryTree = z.infer<typeof directorySchema> & {
  children: DirectoryTree[];
};

export const directoryTreeSchema: z.ZodType<DirectoryTree> = directorySchema.extend({
  children: z.array(z.lazy(() => directoryTreeSchema))
});

export const directoryListQuerySchema = pageQuerySchema.extend({
  sortBy: z.enum(["createdAt", "updatedAt", "name", "sortOrder"]).default("sortOrder")
});

export const directoryListResponseSchema = buildPaginatedResponseSchema(directorySchema);
