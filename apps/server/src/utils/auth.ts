import { createHash, randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { FastifyReply, FastifyRequest } from "fastify";
import { getDataDir } from "../db/paths";
import { AppError } from "./errors";

const dataDir = getDataDir();
const tokenFile = join(dataDir, "api-token");

let runtimeToken = "";
let runtimeBootId = "";

function ensureDataDir(): void {
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
}

function generateToken(): string {
  return randomBytes(24).toString("hex");
}

export function getApiToken(): string {
  if (runtimeToken) {
    return runtimeToken;
  }

  const envToken = process.env.TESTHUB_API_TOKEN;
  if (envToken && envToken.trim().length > 0) {
    runtimeToken = envToken.trim();
    runtimeBootId = createHash("sha256").update(`${runtimeToken}:${Date.now()}`).digest("hex").slice(0, 16);
    return runtimeToken;
  }

  ensureDataDir();
  if (existsSync(tokenFile)) {
    runtimeToken = readFileSync(tokenFile, "utf8").trim();
  } else {
    runtimeToken = generateToken();
    writeFileSync(tokenFile, runtimeToken, "utf8");
  }

  runtimeBootId = createHash("sha256").update(`${runtimeToken}:${Date.now()}`).digest("hex").slice(0, 16);
  return runtimeToken;
}

export function getBootId(): string {
  if (!runtimeBootId) {
    getApiToken();
  }
  return runtimeBootId;
}

export function rotateApiToken(): string {
  const token = generateToken();
  ensureDataDir();
  writeFileSync(tokenFile, token, "utf8");
  runtimeToken = token;
  runtimeBootId = createHash("sha256").update(`${runtimeToken}:${Date.now()}`).digest("hex").slice(0, 16);
  return token;
}

export function resolveOperator(request: FastifyRequest): string {
  const header = request.headers["x-testhub-operator"];
  if (typeof header === "string" && header.trim()) {
    return header.trim();
  }
  return "web-user";
}

export function resolveSource(request: FastifyRequest): "api" | "ui" | "system" {
  const header = request.headers["x-testhub-source"];
  if (header === "ui" || header === "system" || header === "api") {
    return header;
  }
  return "api";
}

export async function verifyApiToken(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const token = request.headers["x-testhub-token"];
  const expected = getApiToken();

  if (typeof token !== "string" || token !== expected) {
    throw new AppError(401, "无效或缺少 x-testhub-token");
  }
}
