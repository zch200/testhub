import { createProjectSchema, idParamSchema, projectListQuerySchema, updateProjectSchema } from "@testhub/shared";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { createProject, deleteProject, getProjectById, listProjects, updateProject } from "../services/project.service";

export async function registerProjectRoutes(app: FastifyInstance): Promise<void> {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.route({
    method: "GET",
    url: "/projects",
    schema: { querystring: projectListQuerySchema },
    handler: (request) => listProjects(request.query)
  });

  server.route({
    method: "POST",
    url: "/projects",
    schema: { body: createProjectSchema },
    handler: (request) => createProject(request.body)
  });

  server.route({
    method: "GET",
    url: "/projects/:id",
    schema: { params: idParamSchema },
    handler: (request) => getProjectById(request.params.id)
  });

  server.route({
    method: "PUT",
    url: "/projects/:id",
    schema: { params: idParamSchema, body: updateProjectSchema },
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
