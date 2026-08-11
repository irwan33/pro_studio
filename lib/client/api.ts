export class ApiClientError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
  }
}

type ApiOptions = {
  method?: string;
  body?: unknown;
  headers?: HeadersInit;
  retryAuth?: boolean;
};

async function readPayload(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as { ok?: boolean; data?: unknown; error?: { code?: string; message?: string } };
  } catch {
    return { ok: false, error: { message: text } };
  }
}

async function refreshAccessToken() {
  const response = await fetch("/api/auth/refresh", { method: "POST", credentials: "same-origin" });
  const payload = await readPayload(response);
  if (!response.ok || !payload?.ok || typeof payload.data !== "object" || payload.data === null || !("accessToken" in payload.data)) return null;
  const accessToken = String((payload.data as { accessToken: string }).accessToken);
  sessionStorage.setItem("pro_studio_access", accessToken);
  return accessToken;
}

function handleUnauthorized() {
  sessionStorage.removeItem("pro_studio_access");
  if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
    window.location.assign("/login");
  }
}

export async function api<T>(url: string, options: ApiOptions = {}): Promise<T> {
  const token = typeof window !== "undefined" ? sessionStorage.getItem("pro_studio_access") : null;
  const response = await fetch(url, {
    method: options.method ?? "GET",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
      ...options.headers
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const payload = await readPayload(response);

  if (response.status === 401 && options.retryAuth !== false && !url.startsWith("/api/auth/")) {
    const nextToken = await refreshAccessToken();
    if (nextToken) return api<T>(url, { ...options, retryAuth: false });
    handleUnauthorized();
  }

  if (!response.ok || !payload?.ok) {
    throw new ApiClientError(payload?.error?.message ?? "Request failed", response.status, payload?.error?.code);
  }

  return payload.data as T;
}
