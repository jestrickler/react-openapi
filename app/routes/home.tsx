import type { Route } from "./+types/home";
import { Link } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "RRv7 + openapi-ts Example" },
    {
      name: "description",
      content: "Production-style CRUD example with loaders, actions, and Suspense queries.",
    },
  ];
}

export default function Home() {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-16">
      <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
        React Router + hey-api/openapi-ts
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        This project shows how to do loader-first reads with
        <span className="font-medium text-slate-800"> queryClient.ensureQueryData</span>,
        then render with Suspense and useSuspenseQuery, while handling writes in route actions.
      </p>
      <div className="mt-10">
        <Link
          to="/pets"
          className="inline-flex items-center rounded-md bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          Open Pets CRUD Example
        </Link>
      </div>
    </main>
  );
}
