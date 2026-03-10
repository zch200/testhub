import { createLibrarySchema, idParamSchema, libraryListQuerySchema, libraryListResponseSchema, librarySchema, updateLibrarySchema } from "@testhub/shared";
import { z } from "zod";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { createLibrary, deleteLibrary, getLibraryById, listLibraries, updateLibrary } from "../services/library.service";

const projectIdParamSchema = z.object({
  projectId: z.coerce.number().int().positive()
});

export async function registerLibraryRoutes(app: FastifyInstance): Promise<void> {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.route({
    method: "GET",
    url: "/projects/:projectId/libraries",
    schema: { params: projectIdParamSchema, querystring: libraryListQuerySchema, response: { 200: libraryListResponseSchema } },
    handler: (request) => listLibraries(request.params.projectId, request.query)
  });

  server.route({
    method: "POST",
    url: "/projects/:projectId/libraries",
    schema: { params: projectIdParamSchema, body: createLibrarySchema, response: { 200: librarySchema } },
    handler: (request) => createLibrary(request.params.projectId, request.body)
  });

  server.route({
    method: "GET",
    url: "/libraries/:id",
    schema: { params: idParamSchema, response: { 200: librarySchema } },
    handler: (request) => getLibraryById(request.params.id)
  });

  server.route({
    method: "PUT",
    url: "/libraries/:id",
    schema: { params: idParamSchema, body: updateLibrarySchema, response: { 200: librarySchema } },
    handler: (request) => updateLibrary(request.params.id, request.body)
  });

  server.route({
    method: "DELETE",
    url: "/libraries/:id",
    schema: { params: idParamSchema },
    handler: (request, reply) => {
      deleteLibrary(request.params.id);
      reply.status(204).send();
    }
  });
}
