import { createPlanSchema, idParamSchema, planListQuerySchema, planListResponseSchema, planSchema, planStatsSchema, updatePlanSchema } from "@testhub/shared";
import { z } from "zod";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { createPlan, deletePlan, getPlanById, getPlanStats, listPlans, updatePlan } from "../services/plan.service";

const projectIdParamSchema = z.object({
  projectId: z.coerce.number().int().positive()
});

export async function registerPlanRoutes(app: FastifyInstance): Promise<void> {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.route({
    method: "GET",
    url: "/projects/:projectId/plans",
    schema: { params: projectIdParamSchema, querystring: planListQuerySchema, response: { 200: planListResponseSchema } },
    handler: (request) => listPlans(request.params.projectId, request.query)
  });

  server.route({
    method: "POST",
    url: "/projects/:projectId/plans",
    schema: { params: projectIdParamSchema, body: createPlanSchema, response: { 200: planSchema } },
    handler: (request) => createPlan(request.params.projectId, request.body)
  });

  server.route({
    method: "GET",
    url: "/plans/:id",
    schema: { params: idParamSchema, response: { 200: planSchema } },
    handler: (request) => getPlanById(request.params.id)
  });

  server.route({
    method: "PUT",
    url: "/plans/:id",
    schema: { params: idParamSchema, body: updatePlanSchema, response: { 200: planSchema } },
    handler: (request) => updatePlan(request.params.id, request.body)
  });

  server.route({
    method: "DELETE",
    url: "/plans/:id",
    schema: { params: idParamSchema },
    handler: (request, reply) => {
      deletePlan(request.params.id);
      reply.status(204).send();
    }
  });

  server.route({
    method: "GET",
    url: "/plans/:id/stats",
    schema: { params: idParamSchema, response: { 200: planStatsSchema } },
    handler: (request) => getPlanStats(request.params.id)
  });
}
