const INPUT_CLASS = "bg-white p-5 rounded shadow-md w-80 md:w-[420px]";
const HALF_INPUT_CLASS = "bg-white p-5 rounded shadow-md w-80 md:w-51.25";

export default function AddressStep({ form, onChange }) {
  return (
    <div className="flex flex-col gap-4 items-center w-full">
      <input
        className={INPUT_CLASS}
        name="companyAddress"
        type="text"
        required
        value={form.companyAddress}
        onChange={(event) => onChange("companyAddress", event.target.value)}
        placeholder="Adresse"
      />

      <div className="flex flex-col md:flex-row gap-4 items-center w-full justify-center">
        <input
          className={HALF_INPUT_CLASS}
          name="companyZip"
          type="text"
          required
          value={form.companyZip}
          onChange={(event) => onChange("companyZip", event.target.value)}
          placeholder="Code postal"
        />

        <input
          className={HALF_INPUT_CLASS}
          name="companyCity"
          type="text"
          required
          value={form.companyCity}
          onChange={(event) => onChange("companyCity", event.target.value)}
          placeholder="Ville"
        />
      </div>

      <input
        className={INPUT_CLASS}
        name="companyCountry"
        type="text"
        required
        value={form.companyCountry}
        onChange={(event) => onChange("companyCountry", event.target.value)}
        placeholder="Pays"
      />
    </div>
  );
}
