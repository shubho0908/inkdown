import { z } from "zod";

export const uuidSchema = z.string().uuid();

export const nullableUuidSchema = z.string().uuid().nullable();

/** Better Auth user ids (text primary keys; may be UUID-shaped for migrated users). */
export const userIdSchema = z.string().min(1);

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Please enter a valid email address")
  .transform((value) => value.toLowerCase());

export const isoDateTimeSchema = z.string().min(1);

export const nonEmptyStringSchema = z.string().trim().min(1);
