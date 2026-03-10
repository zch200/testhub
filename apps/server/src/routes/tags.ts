import { createTagSchema, idParamSchema, tagListQuerySchema, tagListResponseSchema, tagSchema } from "@testhub/shared";
import { z } from "zod";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { createTag, deleteTag, listTags } from "../services/tag.service";

const libraryIdParamSchema = z.object({
  libraryId: z.coerce.number().int().positive()
});

export async function registerTagRoutes(app: FastifyInstance): Promise<void> {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.route({
    method: "GET",
    url: "/libraries/:libraryId/tags",
    schema: { params: libraryIdParamSchema, querystring: tagListQuerySchema, response: { 200: tagListResponseSchema } },
    handler: (request) => listTags(request.params.libraryId, request.query)
  });

  server.route({
    method: "POST",
    url: "/libraries/:libraryId/tags",
    schema: { params: libraryIdParamSchema, body: createTagSchema, response: { 200: tagSchema } },
    handler: (request) => createTag(request.params.libraryId, request.body)
  });

  server.route({
    method: "DELETE",
    url: "/tags/:id",
    schema: { params: idParamSchema },
    handler: (request, reply) => {
      deleteTag(request.params.id);
      reply.status(204).send();
    }
  });
}
