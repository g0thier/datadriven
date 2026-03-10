const INPUT_CLASS = "bg-white p-5 rounded shadow-md w-80 md:w-[420px]";
const HALF_INPUT_CLASS = "bg-white p-5 rounded shadow-md w-80 md:w-51.25";

export default function AdminStep({ form, onChange }) {
  return (
    <div className="flex flex-col gap-4 items-center w-full">
      <div className="flex flex-col md:flex-row gap-4 items-center w-full justify-center">
        <input
          className={HALF_INPUT_CLASS}
          name="adminFirstName"
          type="text"
          required
          value={form.adminFirstName}
          onChange={(event) => onChange("adminFirstName", event.target.value)}
          placeholder="Prénom"
        />

        <input
          className={HALF_INPUT_CLASS}
          name="adminLastName"
          type="text"
          required
          value={form.adminLastName}
          onChange={(event) => onChange("adminLastName", event.target.value)}
          placeholder="Nom"
        />
      </div>

      <input
        className={INPUT_CLASS}
        name="adminEmail"
        type="email"
        required
        value={form.adminEmail}
        onChange={(event) => onChange("adminEmail", event.target.value)}
        placeholder="Email professionnel"
      />

      <input
        className={INPUT_CLASS}
        name="adminPhone"
        type="tel"
        value={form.adminPhone}
        onChange={(event) => onChange("adminPhone", event.target.value)}
        placeholder="Téléphone (optionnel)"
      />
    </div>
  );
}
