import { Suspense } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Form, Link, redirect, useNavigation } from "react-router";

import { addPet } from "../api/generated/sdk.gen";
import { queryClient } from "../queryClient";
import type { Route } from "./+types/pets";
import {
  coercePetStatus,
  invalidateAllPetLists,
  petListOptions,
  type PetStatus,
} from "./pets.shared";
import {
  formDataToPetRequest,
  parseAndValidatePetForm,
  petFormSchema,
  type PetFormActionData,
} from "./pets.validation";

type PetsActionData = PetFormActionData;

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Pets CRUD | RRv7 + openapi-ts" },
    {
      name: "description",
      content: "Loader-prefetched list + Suspense query + action-based creates.",
    },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const status = coercePetStatus(url.searchParams.get("status"));

  await queryClient.ensureQueryData(petListOptions(status));

  return { status };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent !== "create") {
    return { success: false, error: "Unsupported action." } as PetFormActionData;
  }

  const parseResult = await parseAndValidatePetForm(formData, petFormSchema);

  if (!parseResult.success) {
    return {
      success: false,
      fieldErrors: parseResult.fieldErrors,
    } as PetFormActionData;
  }

  const petData = parseResult.data as any;
  const petPayload = formDataToPetRequest(petData);

  try {
    await addPet({ body: petPayload, throwOnError: true });
    await invalidateAllPetLists();
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create pet. Try again.",
    } as PetFormActionData;
  }

  return redirect(`/pets?status=${petData.status}`);
}

export default function PetsPage({
  actionData,
  loaderData,
}: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmittingCreate =
    navigation.state === "submitting" &&
    navigation.formData?.get("intent") === "create";

  const typedActionData = actionData as PetsActionData | undefined;

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wider text-slate-500">
            Generated client demo
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            Pets CRUD (RRv7 loaders + actions)
          </h1>
        </div>
        <Link
          to="/"
          className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Back Home
        </Link>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Pet List</h2>
            <Form method="get" className="flex items-center gap-3">
              <label className="text-sm font-medium text-slate-600" htmlFor="statusFilter">
                Status
              </label>
              <select
                id="statusFilter"
                name="status"
                defaultValue={loaderData.status}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
              >
                <option value="available">available</option>
                <option value="pending">pending</option>
                <option value="sold">sold</option>
              </select>
              <button
                type="submit"
                className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Apply
              </button>
            </Form>
          </div>

          <Suspense fallback={<PetsListSkeleton />}>
            <PetsList status={loaderData.status} />
          </Suspense>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Create Pet</h2>
          <p className="mt-1 text-sm text-slate-600">
            Validates with generated Zod schemas. Shows per-field errors.
          </p>

          <Form method="post" className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="id">
                ID (optional)
              </label>
              <input
                id="id"
                name="id"
                type="number"
                min={1}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800"
                placeholder="e.g. 10001"
              />
              {typedActionData?.fieldErrors?.id ? (
                <p className="mt-1 text-xs text-red-600">
                  {typedActionData.fieldErrors.id[0]}
                </p>
              ) : null}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800"
                placeholder="Buddy"
              />
              {typedActionData?.success === false && typedActionData?.fieldErrors?.name ? (
                <p className="mt-1 text-xs text-red-600">
                  {typedActionData.fieldErrors.name[0]}
                </p>
              ) : null}
            </div>

            <div>
              <label
                className="mb-1 block text-sm font-medium text-slate-700"
                htmlFor="photoUrl"
              >
                Photo URL
              </label>
              <input
                id="photoUrl"
                name="photoUrl"
                type="url"
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800"
                placeholder="https://images.example.com/pet.jpg"
              />
              {typedActionData?.success === false && typedActionData?.fieldErrors?.photoUrl ? (
                <p className="mt-1 text-xs text-red-600">
                  {typedActionData.fieldErrors.photoUrl[0]}
                </p>
              ) : null}
            </div>

            <div>
              <label
                className="mb-1 block text-sm font-medium text-slate-700"
                htmlFor="createStatus"
              >
                Status
              </label>
              <select
                id="createStatus"
                name="status"
                defaultValue={loaderData.status}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
              >
                <option value="available">available</option>
                <option value="pending">pending</option>
                <option value="sold">sold</option>
              </select>
              {typedActionData?.success === false && typedActionData?.fieldErrors?.status ? (
                <p className="mt-1 text-xs text-red-600">
                  {typedActionData.fieldErrors.status[0]}
                </p>
              ) : null}
            </div>

            {typedActionData?.success === false && typedActionData?.error ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {typedActionData.error}
              </p>
            ) : null}

            <button
              type="submit"
              name="intent"
              value="create"
              disabled={isSubmittingCreate}
              className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmittingCreate ? "Creating..." : "Create Pet"}
            </button>
          </Form>
        </div>
      </section>
    </main>
  );
}

function PetsList({ status }: { status: PetStatus }) {
  const { data } = useSuspenseQuery(petListOptions(status));
  const pets = data ?? [];

  if (pets.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-600">
        No pets found for status: <span className="font-semibold">{status}</span>.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {pets.slice(0, 12).map((pet) => (
        <li
          key={`${pet.id ?? pet.name}-${pet.photoUrls?.[0] ?? "none"}`}
          className="rounded-md border border-slate-200 px-4 py-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium text-slate-900">{pet.name}</p>
              <p className="text-xs text-slate-500">
                id: {pet.id ?? "(none)"} • status: {pet.status ?? "unknown"}
              </p>
            </div>
            {pet.id ? (
              <Link
                to={`/pets/${pet.id}/edit`}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-700 hover:bg-slate-50"
              >
                Edit
              </Link>
            ) : (
              <span className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                No ID
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function PetsListSkeleton() {
  return (
    <ul className="space-y-3" aria-hidden>
      {Array.from({ length: 6 }).map((_, idx) => (
        <li
          key={idx}
          className="h-16 animate-pulse rounded-md border border-slate-200 bg-slate-100"
        />
      ))}
    </ul>
  );
}
