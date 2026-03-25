/**
 * @module components/auth/register-company/steps/AdminStep
 * @description UI component module for AdminStep.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */
const INPUT_CLASS = "bg-white p-5 rounded shadow-md w-80 md:w-[420px]";
const HALF_INPUT_CLASS = "bg-white p-5 rounded shadow-md w-80 md:w-51.25";

/**
 * Renders the AdminStep component.
 * @param {Object} props - Component props.
 * @param {*} props.form - form prop.
 * @param {*} props.onChange - onChange prop.
 * @returns {JSX.Element|null} Rendered component output.
 *
 * @example
 * import AdminStep from "../components/auth/register-company/steps/AdminStep";
 *
 * // Real usage reference: src/components/auth/register-company/RegisterCompanyForm.jsx
 * <AdminStep />;
 */
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
