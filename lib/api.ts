import { z } from "zod";

import { formatZodError } from "@/lib/validation/parse";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function buildApiRequestInit(init?: RequestInit): RequestInit {
  const headers = new Headers(init?.headers);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  return {
    ...init,
    headers,
    credentials: init?.credentials ?? "same-origin",
    cache: init?.cache ?? "no-store",
  };
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function getErrorMessage(data: unknown): string {
  if (typeof data === "string" && data.trim()) {
    return data;
  }

  if (data && typeof data === "object") {
    if ("error" in data && typeof data.error === "string" && data.error.trim()) {
      return data.error;
    }

    if ("message" in data && typeof data.message === "string" && data.message.trim()) {
      return data.message;
    }
  }

  return "Request failed";
}

export async function fetchApi(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return fetch(input, buildApiRequestInit(init));
}

export async function fetchJson<S extends z.ZodTypeAny>(
  input: RequestInfo | URL,
  schema: S,
  init?: RequestInit,
): Promise<z.infer<S>> {
  const response = await fetchApi(input, init);
  const data = await parseResponseBody(response);

  if (!response.ok) {
    throw new ApiError(getErrorMessage(data), response.status);
  }

  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new ApiError(`Invalid API response: ${formatZodError(parsed.error)}`, response.status);
  }

  return parsed.data;
}
