import { createProjectSchema, idParamSchema, projectListQuerySchema, projectListResponseSchema, projectSchema, updateProjectSchema } from "@testhub/shared";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { createProject, deleteProject, getProjectById, listProjects, updateProject } from "../services/project.service";

export async function registerProjectRoutes(app: FastifyInstance): Promise<void> {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.route({
    method: "GET",
    url: "/projects",
    schema: { querystring: projectListQuerySchema, response: { 200: projectListResponseSchema } },
    handler: (request) => listProjects(request.query)
  });

  server.route({
    method: "POST",
    url: "/projects",
    schema: { body: createProjectSchema, response: { 200: projectSchema } },
    handler: (request) => createProject(request.body)
  });

  server.route({
    method: "GET",
    url: "/projects/:id",
    schema: { params: idParamSchema, response: { 200: projectSchema } },
    handler: (request) => getProjectById(request.params.id)
  });

  server.route({
    method: "PUT",
    url: "/projects/:id",
    schema: { params: idParamSchema, body: updateProjectSchema, response: { 200: projectSchema } },
    handler: (request) => updateProject(request.params.id, request.body)
  });

  server.route({
    method: "DELETE",
    url: "/projects/:id",
    schema: { params: idParamSchema },
    handler: (request, reply) => {
      deleteProject(request.params.id);
      reply.status(204).send();
    }
  });
}
