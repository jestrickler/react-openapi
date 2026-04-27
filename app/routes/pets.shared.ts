import {
  findPetsByStatusOptions,
  findPetsByStatusQueryKey,
  getPetByIdOptions,
  getPetByIdQueryKey,
} from "../api/generated/@tanstack/react-query.gen";
import { queryClient } from "../queryClient";

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
  findPetsByStatusOptions({ query: { status: [status] } });

export const petDetailOptions = (petId: number) =>
  getPetByIdOptions({ path: { petId } });

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
