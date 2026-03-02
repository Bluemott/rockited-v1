/**
 * Helpers for testing Next.js App Router API route handlers.
 * Use with @vitest-environment node in test files.
 */
import { NextRequest } from "next/server";

export interface CreateMockRequestOptions {
  method?: string;
  body?: string | Record<string, unknown>;
  headers?: HeadersInit;
}

const BASE_URL = "http://localhost:3000";

/**
 * Build a NextRequest for route handler tests.
 * For GET, body is ignored. For POST/PUT/PATCH, body is JSON-stringified if an object.
 */
export function createMockRequest(
  path: string,
  options: CreateMockRequestOptions = {}
): NextRequest {
  const { method = "GET", body, headers = {} } = options;
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;

  const init: RequestInit = {
    method,
    headers: new Headers(headers),
  };

  if (method !== "GET" && body !== undefined) {
    init.body = typeof body === "string" ? body : JSON.stringify(body);
    const h = init.headers as Headers;
    if (!h.has("Content-Type")) {
      h.set("Content-Type", "application/json");
    }
  }

  return new NextRequest(url, init as RequestInit & { signal?: AbortSignal });
}

/**
 * Context for dynamic route handlers (e.g. [id]).
 * Use createMockParams({ id: "42" }) for routes that expect { params: Promise<{ id: string }> }.
 */
export function createMockParams<T extends Record<string, string>>(
  params: T
): { params: Promise<T> } {
  return { params: Promise.resolve(params) };
}
