import { Suspense } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Form, Link, redirect } from "react-router";

import { queryClient } from "../queryClient";
import type { Route } from "./+types/pets";
import { coercePetStatus, petListOptions, type PetStatus } from "./pets.shared";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Pets CRUD | RRv7 + openapi-ts" },
    {
      name: "description", content: "Loader-prefetched list + Suspense query.",
    },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const rawStatus = url.searchParams.get("status");
  const status = coercePetStatus(rawStatus);

  // Keep URL state canonical so filters are always shareable/bookmarkable.
  if (rawStatus !== status) {
    url.searchParams.set("status", status);
    return redirect(`${url.pathname}?${url.searchParams.toString()}`);
  }

  await queryClient.ensureQueryData(petListOptions(status));

  return { status };
}

export default function PetsPage({ loaderData }: Route.ComponentProps) {

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
          to="/pets/new"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          Create New Pet
        </Link>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
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
