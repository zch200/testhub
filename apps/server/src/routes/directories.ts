import { createDirectorySchema, idParamSchema, updateDirectorySchema } from "@testhub/shared";
import { z } from "zod";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { createDirectory, deleteDirectory, getDirectoryById, listDirectoryTree, updateDirectory } from "../services/directory.service";

const libraryIdParamSchema = z.object({
  libraryId: z.coerce.number().int().positive()
});

const deleteDirectoryQuerySchema = z.object({
  caseMoveTo: z.enum(["uncategorized", "parent"]).default("uncategorized")
});

export async function registerDirectoryRoutes(app: FastifyInstance): Promise<void> {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.route({
    method: "GET",
    url: "/libraries/:libraryId/directories",
    schema: { params: libraryIdParamSchema },
    handler: (request) => listDirectoryTree(request.params.libraryId)
  });

  server.route({
    method: "POST",
    url: "/libraries/:libraryId/directories",
    schema: { params: libraryIdParamSchema, body: createDirectorySchema },
    handler: (request) => createDirectory(request.params.libraryId, request.body)
  });

  server.route({
    method: "GET",
    url: "/directories/:id",
    schema: { params: idParamSchema },
    handler: (request) => getDirectoryById(request.params.id)
  });

  server.route({
    method: "PUT",
    url: "/directories/:id",
    schema: { params: idParamSchema, body: updateDirectorySchema },
    handler: (request) => updateDirectory(request.params.id, request.body)
  });

  server.route({
    method: "DELETE",
    url: "/directories/:id",
    schema: { params: idParamSchema, querystring: deleteDirectoryQuerySchema },
    handler: (request, reply) => {
      deleteDirectory(request.params.id, request.query.caseMoveTo);
      reply.status(204).send();
    }
  });
}
