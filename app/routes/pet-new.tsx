import { Form, Link, redirect, useNavigation } from "react-router";

import { addPet } from "../api/generated/sdk.gen";
import type { Route } from "./+types/pet-new";
import { PetFormFields } from "./pet-form-fields";
import { invalidateAllPetLists } from "./pets.shared";
import {
  formDataToPetRequest,
  parseAndValidatePetForm,
  petFormSchema,
  type PetFormActionData,
} from "./pets.validation";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Create Pet | RRv7 + openapi-ts" },
    {
      name: "description",
      content: "Dedicated create route with action-driven submit and server-owned IDs.",
    },
  ];
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
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
    return redirect(`/pets?status=${petData.status}`);
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create pet. Try again.",
    } as PetFormActionData;
  }
}

type PetNewActionData = PetFormActionData;

export default function PetNewPage({ actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const typedActionData = actionData as PetNewActionData | undefined;

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wider text-slate-500">
            Pet Creator
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            Create New Pet
          </h1>
        </div>
        <Link
          to="/pets"
          className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Back to List
        </Link>
      </div>

      {typedActionData?.success === false && typedActionData?.error ? (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {typedActionData.error}
        </p>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <Form method="post" className="space-y-4">
          <PetFormFields
            fieldErrors={
              typedActionData?.success === false ? typedActionData.fieldErrors : undefined
            }
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Creating..." : "Create Pet"}
          </button>
        </Form>
      </section>
    </main>
  );
}
