declare global {
  interface Window {
    __TESTHUB_RUNTIME__?: {
      apiBase?: string;
      apiToken?: string;
      bootId?: string;
    };
  }
}

export interface RuntimeConfig {
  apiBase: string;
  apiToken: string;
  bootId: string;
}

export function readRuntimeConfig(): RuntimeConfig {
  const runtime = window.__TESTHUB_RUNTIME__;

  const apiBase = runtime?.apiBase ?? "/api/v1";
  const apiToken = runtime?.apiToken ?? "";
  const bootId = runtime?.bootId ?? "dev";

  return {
    apiBase,
    apiToken,
    bootId
  };
}
