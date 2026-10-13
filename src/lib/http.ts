import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError, type ZodTypeAny, type z } from "zod";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public fieldErrors?: Record<string, string[] | undefined>,
  ) {
    super(message);
  }
}

export const badRequest = (message: string) => new HttpError(400, message);
export const unauthorized = (message = "Please log on to continue") => new HttpError(401, message);
export const forbidden = (message = "You do not have permission to do that") => new HttpError(403, message);
export const notFound = (message = "Not found") => new HttpError(404, message);
export const conflict = (message: string) => new HttpError(409, message);
export const tooManyRequests = (message = "Too many requests. Please try again shortly.") =>
  new HttpError(429, message);

type RouteContext<P> = { params: Promise<P> };

export function route<P = Record<string, never>>(
  handler: (req: NextRequest, params: P) => Promise<Response>,
) {
  return async (req: NextRequest, ctx: RouteContext<P>): Promise<Response> => {
    try {
      const params = await ctx.params;
      assertSameOrigin(req);
      const response = await handler(req, params);
      response.headers.set("Cache-Control", "no-store");
      return response;
    } catch (error) {
      return errorResponse(error);
    }
  };
}

export function errorResponse(error: unknown): Response {
  if (error instanceof HttpError) {
    return NextResponse.json(
      { error: error.message, fieldErrors: error.fieldErrors },
      { status: error.status, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (error instanceof ZodError) {
    const flat = error.flatten();
    const fieldMessage = Object.values(flat.fieldErrors).flat().find((message) => Boolean(message));
    return NextResponse.json(
      { error: flat.formErrors[0] ?? fieldMessage ?? "Please check the highlighted fields", fieldErrors: flat.fieldErrors },
      { status: 400 },
    );
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return NextResponse.json({ error: "A record with these details already exists" }, { status: 409 });
  }
  console.error("[api] unhandled error:", error instanceof Error ? error.message : "unknown error");
  return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
}

export async function readJson<S extends ZodTypeAny>(req: NextRequest, schema: S): Promise<z.output<S>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw badRequest("Request body must be valid JSON");
  }
  return schema.parse(body);
}

export function readQuery<S extends ZodTypeAny>(req: NextRequest, schema: S): z.output<S> {
  const params: Record<string, string> = {};
  req.nextUrl.searchParams.forEach((value, key) => {
    if (value !== "") params[key] = value;
  });
  return schema.parse(params);
}

export function requestMeta(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = (forwarded?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "unknown").trim().slice(0, 64);
  const userAgent = (req.headers.get("user-agent") ?? "unknown").slice(0, 300);
  return { ip, userAgent };
}

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function pageMeta(page: number, pageSize: number, total: number) {
  return { page, pageSize, total, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

/** Rejects browser requests whose Origin does not match this host. */
export function assertSameOrigin(req: NextRequest) {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") return;
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host) throw forbidden("This request was blocked");
  let originHost = "";
  try {
    originHost = new URL(origin).host;
  } catch {
    throw forbidden("This request was blocked");
  }
  if (originHost !== host) throw forbidden("This request was blocked");
}