import { Suspense } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Form, Link, redirect, useNavigation } from "react-router";

import { deletePet, updatePet } from "../api/generated/sdk.gen";
import { queryClient } from "../queryClient";
import type { Route } from "./+types/pet-edit";
import {
  coercePetStatus,
  invalidateAllPetLists,
  invalidatePetDetail,
  petDetailOptions,
} from "./pets.shared";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Edit Pet | RRv7 + openapi-ts" },
    {
      name: "description",
      content: "Loader-prefetched pet detail with action-driven update/delete.",
    },
  ];
}

export async function loader({ params }: Route.LoaderArgs) {
  const petId = Number.parseInt(params.petId, 10);

  if (!Number.isFinite(petId)) {
    throw new Response("Invalid pet id.", { status: 400 });
  }

  await queryClient.ensureQueryData(petDetailOptions(petId));

  return { petId };
}

export async function action({ params, request }: Route.ActionArgs) {
  const petId = Number.parseInt(params.petId, 10);

  if (!Number.isFinite(petId)) {
    return { error: "Invalid pet id." };
  }

  const formData = await request.formData();
  const intent = formData.get("intent");

  try {
    if (intent === "delete") {
      await deletePet({ path: { petId }, throwOnError: true });
      await Promise.all([invalidateAllPetLists(), invalidatePetDetail(petId)]);
      return redirect("/pets");
    }

    if (intent === "update") {
      const name = formData.get("name");
      const photoUrl = formData.get("photoUrl");
      const status = coercePetStatus(formData.get("status"));

      if (typeof name !== "string" || !name.trim()) {
        return { error: "Name is required." };
      }

      if (typeof photoUrl !== "string" || !photoUrl.trim()) {
        return { error: "Photo URL is required." };
      }

      await updatePet({
        body: {
          id: petId,
          name: name.trim(),
          photoUrls: [photoUrl.trim()],
          status,
        },
        throwOnError: true,
      });

      await Promise.all([invalidateAllPetLists(), invalidatePetDetail(petId)]);
      return redirect(`/pets/${petId}/edit`);
    }

    return { error: "Unsupported action." };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Unable to save changes. Try again.",
    };
  }
}

type PetEditActionData = {
  error?: string;
};

export default function PetEditPage({
  actionData,
  loaderData,
}: Route.ComponentProps) {
  const typedActionData = actionData as PetEditActionData | undefined;

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wider text-slate-500">Pet Editor</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            Edit Pet #{loaderData.petId}
          </h1>
        </div>
        <Link
          to="/pets"
          className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Back to List
        </Link>
      </div>

      {typedActionData?.error ? (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {typedActionData.error}
        </p>
      ) : null}

      <Suspense fallback={<PetEditSkeleton />}>
        <PetEditForm petId={loaderData.petId} />
      </Suspense>
    </main>
  );
}

function PetEditForm({ petId }: { petId: number }) {
  const navigation = useNavigation();
  const { data: pet } = useSuspenseQuery(petDetailOptions(petId));

  const isUpdating =
    navigation.state === "submitting" &&
    navigation.formData?.get("intent") === "update";
  const isDeleting =
    navigation.state === "submitting" &&
    navigation.formData?.get("intent") === "delete";

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <Form method="post" className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={pet?.name ?? ""}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="photoUrl">
            Primary Photo URL
          </label>
          <input
            id="photoUrl"
            name="photoUrl"
            type="url"
            required
            defaultValue={pet?.photoUrls?.[0] ?? ""}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="status">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={pet?.status ?? "available"}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
          >
            <option value="available">available</option>
            <option value="pending">pending</option>
            <option value="sold">sold</option>
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            name="intent"
            value="update"
            disabled={isUpdating || isDeleting}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isUpdating ? "Saving..." : "Save Changes"}
          </button>

          <button
            type="submit"
            name="intent"
            value="delete"
            disabled={isUpdating || isDeleting}
            className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isDeleting ? "Deleting..." : "Delete Pet"}
          </button>
        </div>
      </Form>
    </section>
  );
}

function PetEditSkeleton() {
  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm" aria-hidden>
      <div className="h-10 animate-pulse rounded-md bg-slate-100" />
      <div className="h-10 animate-pulse rounded-md bg-slate-100" />
      <div className="h-10 animate-pulse rounded-md bg-slate-100" />
      <div className="h-10 w-40 animate-pulse rounded-md bg-slate-200" />
    </section>
  );
}
