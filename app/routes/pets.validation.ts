import { z } from "zod";
import {
  zFindPetsByStatusResponse,
  zGetPetByIdResponse,
} from "../api/generated/zod.gen";
import type { Pet } from "../api/generated/types.gen";

/**
 * Reuse generated schemas for API responses.
 * These validate that the API returns what we expect, even if schema drifts.
 */
export const petListResponseSchema = zFindPetsByStatusResponse;
export const petDetailResponseSchema = zGetPetByIdResponse;

const petLenientSchema = z.object({
  id: z.union([z.number(), z.bigint()]).optional(),
  name: z.string().optional(),
  photoUrls: z.array(z.string()).optional(),
  status: z.enum(["available", "pending", "sold"]).optional(),
});

const toNumberId = (id: number | bigint | undefined): number | undefined => {
  if (typeof id === "number") {
    return id;
  }
  if (typeof id === "bigint") {
    const asNumber = Number(id);
    return Number.isSafeInteger(asNumber) ? asNumber : undefined;
  }
  return undefined;
};

const normalizePet = (
  item: z.infer<typeof petLenientSchema>,
  fallbackLabel: string,
): Pet => ({
  id: toNumberId(item.id),
  name: item.name?.trim() || fallbackLabel,
  photoUrls: item.photoUrls ?? [],
  status: item.status,
});

// Petstore sometimes returns partial sold records; we normalize instead of failing the whole page.
export const parsePetListResponse = (input: unknown): Pet[] => {
  const parsed = z.array(petLenientSchema).parse(input);
  return parsed.map((item, index) =>
    normalizePet(item, `Unnamed pet ${toNumberId(item.id) ?? index + 1}`),
  );
};

export const parsePetDetailResponse = (input: unknown): Pet => {
  const parsed = petLenientSchema.parse(input);
  return normalizePet(parsed, `Unnamed pet ${toNumberId(parsed.id) ?? "unknown"}`);
};

/**
 * Application-level form validation for creating/updating pets.
 * Parses FormData strings and validates business constraints.
 */
export const petFormSchema = z.object({
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
  const pet: Pet = {
    id: petId,
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
