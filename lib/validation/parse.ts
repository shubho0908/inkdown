import { z } from "zod";

export function formatZodError(error: z.ZodError) {
  return error.errors[0]?.message ?? "Invalid request";
}

export type ParseResult<T> = { success: true; data: T } | { success: false; error: string };

export async function parseJsonBody<S extends z.ZodTypeAny>(
  request: Request,
  schema: S,
): Promise<ParseResult<z.infer<S>>> {
  let json: unknown;

  try {
    json = await request.json();
  } catch {
    return { success: false, error: "Invalid JSON body" };
  }

  const result = schema.safeParse(json);
  if (!result.success) {
    return { success: false, error: formatZodError(result.error) };
  }

  return { success: true, data: result.data };
}

export function parseValue<S extends z.ZodTypeAny>(
  schema: S,
  value: unknown,
): ParseResult<z.infer<S>> {
  const result = schema.safeParse(value);
  if (!result.success) {
    return { success: false, error: formatZodError(result.error) };
  }

  return { success: true, data: result.data };
}
