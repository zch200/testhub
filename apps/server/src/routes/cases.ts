import { batchCreateCaseSchema, caseListQuerySchema, createCaseSchema, idParamSchema, pageQuerySchema, updateCaseSchema } from "@testhub/shared";
import { z } from "zod";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { batchCreateCases, createCase, deleteCase, getCaseById, getCaseVersion, listCases, listCaseVersions, updateCase } from "../services/case.service";

const libraryIdParamSchema = z.object({
  libraryId: z.coerce.number().int().positive()
});

const caseVersionParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
  versionNo: z.coerce.number().int().positive()
});

const caseVersionListQuerySchema = pageQuerySchema.extend({
  sortBy: z.enum(["createdAt"]).default("createdAt")
});

export async function registerCaseRoutes(app: FastifyInstance): Promise<void> {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.route({
    method: "GET",
    url: "/libraries/:libraryId/cases",
    schema: { params: libraryIdParamSchema, querystring: caseListQuerySchema },
    handler: (request) => listCases(request.params.libraryId, request.query)
  });

  server.route({
    method: "POST",
    url: "/libraries/:libraryId/cases",
    schema: { params: libraryIdParamSchema, body: createCaseSchema },
    handler: (request) => createCase(request.params.libraryId, request.body)
  });

  server.route({
    method: "POST",
    url: "/libraries/:libraryId/cases/batch",
    schema: { params: libraryIdParamSchema, body: batchCreateCaseSchema },
    handler: (request) => batchCreateCases(request.params.libraryId, request.body)
  });

  server.route({
    method: "GET",
    url: "/cases/:id",
    schema: { params: idParamSchema },
    handler: (request) => getCaseById(request.params.id)
  });

  server.route({
    method: "PUT",
    url: "/cases/:id",
    schema: { params: idParamSchema, body: updateCaseSchema },
    handler: (request) => updateCase(request.params.id, request.body)
  });

  server.route({
    method: "DELETE",
    url: "/cases/:id",
    schema: { params: idParamSchema },
    handler: (request, reply) => {
      deleteCase(request.params.id);
      reply.status(204).send();
    }
  });

  server.route({
    method: "GET",
    url: "/cases/:id/versions",
    schema: { params: idParamSchema, querystring: caseVersionListQuerySchema },
    handler: (request) => listCaseVersions(request.params.id, request.query)
  });

  server.route({
    method: "GET",
    url: "/cases/:id/versions/:versionNo",
    schema: { params: caseVersionParamsSchema },
    handler: (request) => getCaseVersion(request.params.id, request.params.versionNo)
  });
}
