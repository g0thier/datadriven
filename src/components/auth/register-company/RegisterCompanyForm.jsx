import AddressStep from "./steps/AddressStep";
import AdminStep from "./steps/AdminStep";
import CompanyStep from "./steps/CompanyStep";
import RecapStep from "./steps/RecapStep";
import SecurityStep from "./steps/SecurityStep";

export default function RegisterCompanyForm({ step, form, onChange }) {
  if (step === 1) return <CompanyStep form={form} onChange={onChange} />;
  if (step === 2) return <AddressStep form={form} onChange={onChange} />;
  if (step === 3) return <AdminStep form={form} onChange={onChange} />;
  if (step === 4) return <SecurityStep form={form} onChange={onChange} />;
  return <RecapStep form={form} />;
}
