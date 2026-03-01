import {
  addPlanCasesByDirectorySchema,
  batchUpdatePlanCaseStatusSchema,
  createPlanCasesSchema,
  pageQuerySchema,
  planCaseHistoryListQuerySchema,
  planCaseListQuerySchema,
  updatePlanCaseSchema
} from "@testhub/shared";
import { z } from "zod";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { resolveOperator, resolveSource } from "../utils/auth";
import {
  addPlanCases,
  addPlanCasesByDirectory,
  batchUpdatePlanCaseStatus,
  listPlanCaseHistory,
  listPlanCases,
  listPlanHistory,
  removePlanCase,
  updatePlanCase
} from "../services/plan-case.service";

const planIdParamSchema = z.object({
  planId: z.coerce.number().int().positive()
});

const planCaseIdParamSchema = z.object({
  planId: z.coerce.number().int().positive(),
  planCaseId: z.coerce.number().int().positive()
});

const historyQuerySchema = pageQuerySchema.extend({
  sortBy: z.enum(["createdAt"]).default("createdAt")
});

export async function registerPlanCaseRoutes(app: FastifyInstance): Promise<void> {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.route({
    method: "GET",
    url: "/plans/:planId/cases",
    schema: { params: planIdParamSchema, querystring: planCaseListQuerySchema },
    handler: (request) => listPlanCases(request.params.planId, request.query)
  });

  server.route({
    method: "POST",
    url: "/plans/:planId/cases",
    schema: { params: planIdParamSchema, body: createPlanCasesSchema },
    handler: (request) => addPlanCases(request.params.planId, request.body, resolveOperator(request), resolveSource(request))
  });

  server.route({
    method: "POST",
    url: "/plans/:planId/cases/by-directory",
    schema: { params: planIdParamSchema, body: addPlanCasesByDirectorySchema },
    handler: (request) =>
      addPlanCasesByDirectory(request.params.planId, request.body, resolveOperator(request), resolveSource(request))
  });

  server.route({
    method: "PUT",
    url: "/plans/:planId/cases/:planCaseId",
    schema: { params: planCaseIdParamSchema, body: updatePlanCaseSchema },
    handler: (request) =>
      updatePlanCase(request.params.planId, request.params.planCaseId, request.body, resolveOperator(request), resolveSource(request))
  });

  server.route({
    method: "DELETE",
    url: "/plans/:planId/cases/:planCaseId",
    schema: { params: planCaseIdParamSchema },
    handler: (request, reply) => {
      removePlanCase(request.params.planId, request.params.planCaseId);
      reply.status(204).send();
    }
  });

  server.route({
    method: "POST",
    url: "/plans/:planId/cases/batch-status",
    schema: { params: planIdParamSchema, body: batchUpdatePlanCaseStatusSchema },
    handler: (request, reply) => {
      batchUpdatePlanCaseStatus(request.params.planId, request.body, resolveOperator(request), resolveSource(request));
      reply.status(204).send();
    }
  });

  server.route({
    method: "GET",
    url: "/plans/:planId/cases/:planCaseId/history",
    schema: { params: planCaseIdParamSchema, querystring: planCaseHistoryListQuerySchema },
    handler: (request) => listPlanCaseHistory(request.params.planId, request.params.planCaseId, request.query)
  });

  server.route({
    method: "GET",
    url: "/plans/:planId/history",
    schema: { params: planIdParamSchema, querystring: historyQuerySchema },
    handler: (request) => listPlanHistory(request.params.planId, request.query)
  });
}
