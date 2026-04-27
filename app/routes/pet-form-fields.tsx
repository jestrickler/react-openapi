type PetFormFieldErrors = Record<string, string[]> | undefined;

type PetFormDefaults = {
  name?: string;
  photoUrl?: string;
  status?: "available" | "pending" | "sold";
};

export function PetFormFields({
  defaults,
  fieldErrors,
}: {
  defaults?: PetFormDefaults;
  fieldErrors?: PetFormFieldErrors;
}) {
  return (
    <>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="name">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={defaults?.name ?? ""}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800"
          placeholder="Buddy"
        />
        {fieldErrors?.name && Array.isArray(fieldErrors.name) ? (
          <p className="mt-1 text-xs text-red-600">{fieldErrors.name[0]}</p>
        ) : null}
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
          defaultValue={defaults?.photoUrl ?? ""}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800"
          placeholder="https://images.example.com/pet.jpg"
        />
        {fieldErrors?.photoUrl && Array.isArray(fieldErrors.photoUrl) ? (
          <p className="mt-1 text-xs text-red-600">{fieldErrors.photoUrl[0]}</p>
        ) : null}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="status">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={defaults?.status ?? "available"}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
        >
          <option value="available">available</option>
          <option value="pending">pending</option>
          <option value="sold">sold</option>
        </select>
        {fieldErrors?.status && Array.isArray(fieldErrors.status) ? (
          <p className="mt-1 text-xs text-red-600">{fieldErrors.status[0]}</p>
        ) : null}
      </div>
    </>
  );
}
