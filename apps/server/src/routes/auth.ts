import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { getApiToken, rotateApiToken } from "../utils/auth";

export async function registerAuthRoutes(app: FastifyInstance): Promise<void> {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.route({
    method: "GET",
    url: "/auth/token",
    handler: () => ({ token: getApiToken() })
  });

  server.route({
    method: "POST",
    url: "/auth/rotate-token",
    handler: () => ({ token: rotateApiToken() })
  });
}
