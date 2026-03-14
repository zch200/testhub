import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import fastify from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { jsonSchemaTransform, serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { registerAuthRoutes } from "./routes/auth";
import { registerCaseRoutes } from "./routes/cases";
import { registerDirectoryRoutes } from "./routes/directories";
import { registerLibraryRoutes } from "./routes/libraries";
import { registerPlanCaseRoutes } from "./routes/plan-cases";
import { registerPlanRoutes } from "./routes/plans";
import { registerProjectRoutes } from "./routes/projects";
import { registerTagRoutes } from "./routes/tags";
import { AppError } from "./utils/errors";
import { getApiToken, getBootId, verifyApiToken } from "./utils/auth";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const BUNDLED = process.env.TESTHUB_BUNDLED === "1";

export interface BuildAppOptions {
  logger?: boolean;
}

export function buildApp(options?: BuildAppOptions) {
  const app = fastify({ logger: options?.logger ?? true });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.register(cors, {
    origin: true,
    credentials: false
  });

  app.register(swagger, {
    openapi: {
      info: {
        title: "TestHub API",
        version: "0.1.0"
      }
    },
    transform: jsonSchemaTransform
  });

  app.register(swaggerUi, {
    routePrefix: "/api/docs"
  });

  // GET /skill.md — dynamically inject baseUrl for agent consumption
  app.get("/skill.md", (request, reply) => {
    const skillPath = BUNDLED
      ? join(__dirname, "SKILL.md")
      : resolve(__dirname, "../../../docs/SKILL.md");
    if (!existsSync(skillPath)) {
      return reply.status(404).send({ error: "SKILL.md not found" });
    }

    const protocol = request.headers["x-forwarded-proto"] ?? "http";
    const host = request.headers.host ?? "localhost";
    const baseUrl = `${protocol}://${host}`;

    let content = readFileSync(skillPath, "utf8");
    content = content.replaceAll("{{baseUrl}}", baseUrl);
    content = content.replaceAll("{{token}}", getApiToken());

    return reply.type("text/markdown; charset=utf-8").send(content);
  });

  app.get("/runtime-config.js", (_request, reply) => {
    const payload = {
      apiBase: "/api/v1",
      apiToken: getApiToken(),
      bootId: getBootId()
    };

    const script = `window.__TESTHUB_RUNTIME__ = ${JSON.stringify(payload)};`;
    reply.type("application/javascript").send(script);
  });

  app.register(
    async (api) => {
      api.addHook("preHandler", verifyApiToken);
      await registerAuthRoutes(api);
      await registerProjectRoutes(api);
      await registerLibraryRoutes(api);
      await registerDirectoryRoutes(api);
      await registerCaseRoutes(api);
      await registerTagRoutes(api);
      await registerPlanRoutes(api);
      await registerPlanCaseRoutes(api);
    },
    { prefix: "/api/v1" }
  );

  const publicDir = BUNDLED
    ? join(__dirname, "public")
    : join(__dirname, "../public");
  const indexHtmlPath = join(publicDir, "index.html");
  if (existsSync(publicDir)) {
    app.register(fastifyStatic, {
      root: publicDir,
      index: false
    });

    // Serve SPA index.html for root path (fixes #4: static plugin can't serve directories)
    app.get("/", (_request, reply) => {
      return reply.sendFile("index.html");
    });
  }

  app.setErrorHandler((error: unknown, _request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ error: error.message });
    }

    if (isValidationError(error)) {
      return reply.status(400).send({ error: error.message });
    }

    requestLog(app, error);
    return reply.status(500).send({ error: "服务器内部错误" });
  });

  app.setNotFoundHandler((request, reply) => {
    const url = request.url;
    if (existsSync(indexHtmlPath) && !url.startsWith("/api/") && url !== "/runtime-config.js") {
      const html = readFileSync(indexHtmlPath, "utf8");
      return reply.type("text/html").send(html);
    }

    return reply.status(404).send({ error: "未找到" });
  });

  return app;
}

function requestLog(app: ReturnType<typeof fastify>, error: unknown): void {
  app.log.error(error);
}

function isValidationError(error: unknown): error is { message: string; validation: unknown } {
  if (!error || typeof error !== "object") {
    return false;
  }

  return "validation" in error && "message" in error;
}
