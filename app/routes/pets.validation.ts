import { z } from "zod";
import {
  zFindPetsByStatusResponse,
  zGetPetByIdResponse,
  zPet,
} from "../api/generated/zod.gen";
import type { Pet } from "../api/generated/types.gen";

/**
 * Reuse generated schemas for API responses.
 * These validate that the API returns what we expect, even if schema drifts.
 */
export const petListResponseSchema = zFindPetsByStatusResponse;
export const petDetailResponseSchema = zGetPetByIdResponse;

/**
 * Application-level form validation for creating/updating pets.
 * Parses FormData strings and validates business constraints.
 */
export const petFormSchema = z.object({
  id: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => {
      if (!val || val === "") return undefined;
      const num = Number(val);
      return Number.isFinite(num) && num > 0 ? num : undefined;
    })
    .refine((val) => val === undefined || Number.isFinite(val), {
      message: "ID must be a positive number",
    }),
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be under 100 characters"),
  photoUrl: z
    .string()
    .trim()
    .min(1, "Photo URL is required")
    .url("Photo URL must be a valid URL"),
  status: z.enum(["available", "pending", "sold"]).default("available"),
});

export type PetFormData = z.infer<typeof petFormSchema>;

/**
 * Transform validated form data into a Pet request body matching generated schema.
 * Converts bigint to number for API compatibility.
 */
export const formDataToPetRequest = (
  data: PetFormData,
  petId?: number,
): Pet => {
  // Generated Zod schemas use bigint, but API expects number
  const pet: Pet = {
    id: petId ?? data.id,
    name: data.name,
    photoUrls: [data.photoUrl],
    status: data.status as "available" | "pending" | "sold" | undefined,
  };

  return pet;
};

/**
 * Parse FormData into validated object with per-field errors.
 * Returns either { success: true, data } or { success: false, fieldErrors }.
 */
export async function parseAndValidatePetForm(
  formData: FormData,
  schema: z.ZodSchema,
): Promise<
  | { success: true; data: unknown }
  | { success: false; fieldErrors: Record<string, string[]> }
> {
  const obj = Object.fromEntries(formData);
  const result = schema.safeParse(obj);

  if (!result.success) {
    return {
      success: false,
      fieldErrors: result.error.flatten().fieldErrors,
    };
  }

  return {
    success: true,
    data: result.data,
  };
}

/**
 * Type helpers for action return values with structured errors.
 */
export type PetFormActionData =
  | { success: true; fieldErrors?: undefined }
  | {
      success: false;
      error?: string;
      fieldErrors?: Record<string, string[]>;
    };
