import Navbar from "../../components/Navbar.jsx";
import SectionNavButtons from "../../components/SectionNavButtons.jsx";
import Cards from "../../components/management/Cards.jsx";
import ManageSubscriptionButton from "../../components/management/ManageSubscriptionButton.jsx";
import SubscriptionCapacityInline from "../../components/management/SubscriptionCapacityInline.jsx";
import SubscriptionActionError from "../../components/management/SubscriptionActionError.jsx";
import SubscriptionStatusMessage from "../../components/management/SubscriptionStatusMessage.jsx";
import { managementLinks } from "../../constants/navigationLinks.js";
import { PLANS } from "../../constants/managementPlans.js";
import useAbonnementPage from "../../hooks/management/useAbonnementPage.js";

export default function Abonnement() {
  const {
    loadingPlanName,
    isPortalLoading,
    actionError,
    statusMessage,
    handleStartCheckout,
    handleOpenBillingPortal,
  } = useAbonnementPage();

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-200 px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-4xl font-bold text-gray-800">Abonnement</h1>
            <SectionNavButtons
              links={managementLinks}
              ariaLabel="Navigation management"
              variant="page"
            />
          </div>

          <SubscriptionStatusMessage statusMessage={statusMessage} />

          <SubscriptionActionError message={actionError} />

          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            
            <SubscriptionCapacityInline />
            
            <ManageSubscriptionButton
              onClick={handleOpenBillingPortal}
              isLoading={isPortalLoading}
              isDisabled={false}
            />
          </div>

          <Cards
            plans={PLANS}
            onSelectPlan={handleStartCheckout}
            loadingPlanName={loadingPlanName}
          />
        </div>
      </div>
    </>
  );
}
