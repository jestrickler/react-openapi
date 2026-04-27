import {
  findPetsByStatusQueryKey,
  getPetByIdQueryKey,
} from "../api/generated/@tanstack/react-query.gen";
import { queryOptions } from "@tanstack/react-query";
import { findPetsByStatus, getPetById } from "../api/generated/sdk.gen";
import { queryClient } from "../queryClient";
import { petDetailResponseSchema, petListResponseSchema } from "./pets.validation";

export const PET_STATUSES = ["available", "pending", "sold"] as const;

export type PetStatus = (typeof PET_STATUSES)[number];

export const coercePetStatus = (
  value: FormDataEntryValue | string | null | undefined,
): PetStatus => {
  if (typeof value !== "string") {
    return "available";
  }

  return PET_STATUSES.includes(value as PetStatus)
    ? (value as PetStatus)
    : "available";
};

export const petListOptions = (status: PetStatus) =>
  queryOptions({
    queryKey: findPetsByStatusQueryKey({ query: { status: [status] } }),
    queryFn: async ({ signal }) => {
      const { data } = await findPetsByStatus({
        query: { status: [status] },
        signal,
        throwOnError: true,
      });
      return petListResponseSchema.parse(data);
    },
  });

export const petDetailOptions = (petId: number) =>
  queryOptions({
    queryKey: getPetByIdQueryKey({ path: { petId } }),
    queryFn: async ({ signal }) => {
      const { data } = await getPetById({
        path: { petId },
        signal,
        throwOnError: true,
      });
      return petDetailResponseSchema.parse(data);
    },
  });

export const invalidateAllPetLists = async () => {
  await Promise.all(
    PET_STATUSES.map((status) =>
      queryClient.invalidateQueries({
        queryKey: findPetsByStatusQueryKey({ query: { status: [status] } }),
      }),
    ),
  );
};

export const invalidatePetDetail = async (petId: number) => {
  await queryClient.invalidateQueries({
    queryKey: getPetByIdQueryKey({ path: { petId } }),
  });
};
