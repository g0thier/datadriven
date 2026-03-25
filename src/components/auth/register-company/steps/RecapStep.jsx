/**
 * @module components/auth/register-company/steps/RecapStep
 * @description UI component module for RecapStep.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */
/**
 * Renders the RecapStep component.
 * @param {Object} props - Component props.
 * @param {*} props.form - form prop.
 * @returns {JSX.Element|null} Rendered component output.
 *
 * @example
 * import RecapStep from "../components/auth/register-company/steps/RecapStep";
 *
 * // Real usage reference: src/components/auth/register-company/RegisterCompanyForm.jsx
 * <RecapStep />;
 */
export default function RecapStep({ form }) {
  return (
    <div className="bg-white/70 rounded shadow-md w-80 md:w-105 p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Récapitulatif</h2>

      <div className="text-sm text-gray-800 space-y-3">
        <div>
          <p className="font-semibold">Entreprise</p>
          <p>{form.companyName}</p>
          <p className="text-gray-700">
            {form.companyAddress}, {form.companyZip} {form.companyCity}, {form.companyCountry}
          </p>

          {(form.legalForm || form.vatNumber || form.siret) && (
            <p className="text-gray-700">
              {form.legalForm ? `Forme: ${form.legalForm} · ` : ""}
              {form.vatNumber ? `TVA: ${form.vatNumber} · ` : ""}
              {form.siret ? `Registre: ${form.siret}` : ""}
            </p>
          )}
        </div>

        <div>
          <p className="font-semibold">Administrateur</p>
          <p>
            {form.adminFirstName} {form.adminLastName}
          </p>
          <p className="text-gray-700">{form.adminEmail}</p>
          {form.adminPhone && <p className="text-gray-700">{form.adminPhone}</p>}
        </div>

        <p className="text-xs text-gray-600">
          En créant le compte, vous pourrez ensuite inviter des collaborateurs et compléter les
          infos légales.
        </p>
      </div>
    </div>
  );
}
