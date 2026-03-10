import zebra from "../../assets/zebra.svg";
import SwapLink from "../../components/SwapLink";
import RegisterActions from "../../components/auth/register-company/RegisterActions";
import RegisterCompanyForm from "../../components/auth/register-company/RegisterCompanyForm";
import RegisterProgress from "../../components/auth/register-company/RegisterProgress";
import useRegisterCompany from "../../hooks/useRegisterCompany";

function RegisterCompany() {
  const {
    step,
    title,
    subtitle,
    form,
    canGoNext,
    isSubmitting,
    submitError,
    updateField,
    handleBack,
    handleSubmit,
  } = useRegisterCompany();

  return (
    <div className="w-full bg-amber-300 min-h-screen">
      <img
        src={zebra}
        alt="Zebra"
        className="absolute bottom-0 left-0 w-[60%] h-[60%] object-cover"
      />

      <div className="flex items-center justify-center flex-col min-h-screen relative px-6 py-10">
        <h1 className="text-4xl md:text-5xl text-gray-800 font-bold mb-4 text-center">{title}</h1>

        <p className="text-gray-700 mb-8 text-center max-w-md">{subtitle}</p>

        <RegisterProgress step={step} />

        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 w-full">
          <RegisterCompanyForm step={step} form={form} onChange={updateField} />

          {submitError && <p className="text-sm text-red-700 text-center">{submitError}</p>}

          <RegisterActions
            step={step}
            canGoNext={canGoNext}
            isSubmitting={isSubmitting}
            onBack={handleBack}
          />
        </form>

        <div className="flex items-center gap-6 mt-8 flex-wrap justify-center">
          <SwapLink
            to="/login"
            part1="Déjà un compte ?"
            part2="Connectez-vous !"
            align="center"
          />
        </div>
      </div>
    </div>
  );
}

export default RegisterCompany;
