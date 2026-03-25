/**
 * @module components/auth/register-company/steps/AddressStep
 * @description UI component module for AddressStep.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */
const INPUT_CLASS = "bg-white p-5 rounded shadow-md w-80 md:w-[420px]";
const HALF_INPUT_CLASS = "bg-white p-5 rounded shadow-md w-80 md:w-51.25";

/**
 * Renders the AddressStep component.
 * @param {Object} props - Component props.
 * @param {*} props.form - form prop.
 * @param {*} props.onChange - onChange prop.
 * @returns {JSX.Element|null} Rendered component output.
 *
 * @example
 * import AddressStep from "../components/auth/register-company/steps/AddressStep";
 *
 * // Real usage reference: src/components/auth/register-company/RegisterCompanyForm.jsx
 * <AddressStep />;
 */
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
