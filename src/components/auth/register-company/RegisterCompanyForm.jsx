/**
 * @module components/auth/register-company/RegisterCompanyForm
 * @description UI component module for RegisterCompanyForm.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */
import AddressStep from "./steps/AddressStep";
import AdminStep from "./steps/AdminStep";
import CompanyStep from "./steps/CompanyStep";
import RecapStep from "./steps/RecapStep";
import SecurityStep from "./steps/SecurityStep";

/**
 * Renders the RegisterCompanyForm component.
 * @param {Object} props - Component props.
 * @param {*} props.step - step prop.
 * @param {*} props.form - form prop.
 * @param {*} props.onChange - onChange prop.
 * @returns {JSX.Element|null} Rendered component output.
 *
 * @example
 * import RegisterCompanyForm from "../components/auth/register-company/RegisterCompanyForm";
 *
 * // Real usage reference: src/pages/auth/RegisterCompany.jsx
 * <RegisterCompanyForm />;
 */
export default function RegisterCompanyForm({ step, form, onChange }) {
  if (step === 1) return <CompanyStep form={form} onChange={onChange} />;
  if (step === 2) return <AddressStep form={form} onChange={onChange} />;
  if (step === 3) return <AdminStep form={form} onChange={onChange} />;
  if (step === 4) return <SecurityStep form={form} onChange={onChange} />;
  return <RecapStep form={form} />;
}
