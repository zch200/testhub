import {
  addPlanCasesByDirectorySchema,
  addPlanCasesResponseSchema,
  batchUpdatePlanCaseStatusSchema,
  createPlanCaseRemarkSchema,
  createPlanCasesSchema,
  pageQuerySchema,
  planCaseDetailListResponseSchema,
  planCaseHistoryListResponseSchema,
  planCaseListQuerySchema,
  planCaseRemarkListResponseSchema,
  planCaseRemarkSchema,
  planCaseRemarkListQuerySchema,
  planCaseHistoryListQuerySchema,
  planCaseSchema,
  updatePlanCaseSchema
} from "@testhub/shared";
import { z } from "zod";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { resolveOperator, resolveSource } from "../utils/auth";
import {
  addPlanCaseRemark,
  addPlanCases,
  addPlanCasesByDirectory,
  batchUpdatePlanCaseStatus,
  listPlanCaseHistory,
  listPlanCaseRemarks,
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
    schema: { params: planIdParamSchema, querystring: planCaseListQuerySchema, response: { 200: planCaseDetailListResponseSchema } },
    handler: (request) => listPlanCases(request.params.planId, request.query)
  });

  server.route({
    method: "POST",
    url: "/plans/:planId/cases",
    schema: { params: planIdParamSchema, body: createPlanCasesSchema, response: { 200: addPlanCasesResponseSchema } },
    handler: (request) => addPlanCases(request.params.planId, request.body, resolveOperator(request), resolveSource(request))
  });

  server.route({
    method: "POST",
    url: "/plans/:planId/cases/by-directory",
    schema: { params: planIdParamSchema, body: addPlanCasesByDirectorySchema, response: { 200: addPlanCasesResponseSchema } },
    handler: (request) =>
      addPlanCasesByDirectory(request.params.planId, request.body, resolveOperator(request), resolveSource(request))
  });

  server.route({
    method: "PUT",
    url: "/plans/:planId/cases/:planCaseId",
    schema: { params: planCaseIdParamSchema, body: updatePlanCaseSchema, response: { 200: planCaseSchema } },
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
    method: "POST",
    url: "/plans/:planId/cases/:planCaseId/remarks",
    schema: { params: planCaseIdParamSchema, body: createPlanCaseRemarkSchema, response: { 201: planCaseRemarkSchema } },
    handler: (request, reply) => {
      const result = addPlanCaseRemark(request.params.planId, request.params.planCaseId, request.body.content);
      reply.status(201).send(result);
    }
  });

  server.route({
    method: "GET",
    url: "/plans/:planId/cases/:planCaseId/remarks",
    schema: { params: planCaseIdParamSchema, querystring: planCaseRemarkListQuerySchema, response: { 200: planCaseRemarkListResponseSchema } },
    handler: (request) => listPlanCaseRemarks(request.params.planId, request.params.planCaseId, request.query)
  });

  server.route({
    method: "GET",
    url: "/plans/:planId/cases/:planCaseId/history",
    schema: { params: planCaseIdParamSchema, querystring: planCaseHistoryListQuerySchema, response: { 200: planCaseHistoryListResponseSchema } },
    handler: (request) => listPlanCaseHistory(request.params.planId, request.params.planCaseId, request.query)
  });

  server.route({
    method: "GET",
    url: "/plans/:planId/history",
    schema: { params: planIdParamSchema, querystring: historyQuerySchema, response: { 200: planCaseHistoryListResponseSchema } },
    handler: (request) => listPlanHistory(request.params.planId, request.query)
  });
}
