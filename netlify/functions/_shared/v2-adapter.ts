/**
 * Bridge between the classic Lambda-style event handlers used throughout this
 * project and Netlify's v2 function API.
 *
 * Netlify only reads an in-source `config` export (including `rateLimit`) when
 * the module has a default export and does NOT export a binding named
 * `handler`. These helpers let a function keep its existing event-based logic
 * while exposing the v2 `Request -> Response` signature.
 */

export type LambdaResult = {
  statusCode: number;
  body?: string | null;
  headers?: Record<string, string>;
};

export type LambdaEvent = {
  httpMethod: string;
  headers: Record<string, string>;
  body: string | null;
};

export async function toLambdaEvent(request: Request): Promise<LambdaEvent> {
  const body =
    request.method === "GET" || request.method === "HEAD"
      ? null
      : await request.text();

  return {
    httpMethod: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body,
  };
}

export function toWebResponse(result: LambdaResult): Response {
  return new Response(result.body ?? "", {
    status: result.statusCode,
    headers: result.headers,
  });
}
