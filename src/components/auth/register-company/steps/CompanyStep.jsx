const INPUT_CLASS = "bg-white p-5 rounded shadow-md w-80 md:w-[420px]";
const HALF_INPUT_CLASS = "bg-white p-5 rounded shadow-md w-80 md:w-51.25";

export default function CompanyStep({ form, onChange }) {
  return (
    <div className="flex flex-col gap-4 items-center w-full">
      <input
        className={INPUT_CLASS}
        name="companyName"
        type="text"
        required
        value={form.companyName}
        onChange={(event) => onChange("companyName", event.target.value)}
        placeholder="Nom de l'entreprise"
      />

      <div className="flex flex-col md:flex-row gap-4 items-center w-full justify-center">
        <input
          className={HALF_INPUT_CLASS}
          name="legalForm"
          type="text"
          value={form.legalForm}
          onChange={(event) => onChange("legalForm", event.target.value)}
          placeholder="Forme (SA, Sàrl...)"
        />

        <input
          className={HALF_INPUT_CLASS}
          name="vatNumber"
          type="text"
          value={form.vatNumber}
          onChange={(event) => onChange("vatNumber", event.target.value)}
          placeholder="N° TVA (optionnel)"
        />
      </div>

      <input
        className={INPUT_CLASS}
        name="siret"
        type="text"
        value={form.siret}
        onChange={(event) => onChange("siret", event.target.value)}
        placeholder="N° registre (UID/SIRET) (optionnel)"
      />
    </div>
  );
}
