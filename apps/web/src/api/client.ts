import { readRuntimeConfig } from "../lib/runtime";

interface RequestOptions extends RequestInit {
  query?: Record<string, string | number | boolean | undefined>;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const { apiBase } = readRuntimeConfig();
  const basePath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${apiBase}${basePath}`, window.location.origin);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined) {
        continue;
      }
      url.searchParams.set(key, String(value));
    }
  }

  return url.pathname + url.search;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const runtime = readRuntimeConfig();
  const response = await fetch(buildUrl(path, options.query), {
    ...options,
    headers: {
      "content-type": "application/json",
      "x-testhub-token": runtime.apiToken,
      "x-testhub-operator": "web-user",
      "x-testhub-source": "ui",
      ...(options.headers ?? {})
    }
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({ error: response.statusText }))) as { error?: string };
    throw new Error(data.error ?? "Request failed");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
