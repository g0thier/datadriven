import Navbar from "../../components/Navbar.jsx";
import SectionNavButtons from "../../components/SectionNavButtons.jsx";
import Cards from "../../components/management/Cards.jsx";
import ManageSubscriptionButton from "../../components/management/ManageSubscriptionButton.jsx";
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
    companyRoleCounts,
    managerLimit,
    collaboratorLimit,
    handleStartCheckout,
    handleOpenBillingPortal,
  } = useAbonnementPage();

  const managerLimitLabel = managerLimit > 0 ? managerLimit : "-";
  const collaboratorLimitLabel = collaboratorLimit > 0 ? collaboratorLimit : "-";

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

          <ManageSubscriptionButton
            onClick={handleOpenBillingPortal}
            isLoading={isPortalLoading}
            isDisabled={false}
            leftContent={
              <div className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Capacité de l&apos;abonnement
                </p>

                <div className="space-y-1.5 text-sm text-slate-700">
                  <p className="flex items-center justify-between gap-3">
                    <span>Owner / managers</span>
                    <span className="font-semibold">
                      {companyRoleCounts.owner} / {managerLimitLabel}
                    </span>
                  </p>

                  <p className="flex items-center justify-between gap-3">
                    <span>Leader / managers</span>
                    <span className="font-semibold">
                      {companyRoleCounts.leader} / {managerLimitLabel}
                    </span>
                  </p>

                  <p className="flex items-center justify-between gap-3">
                    <span>Colab / collaborateurs</span>
                    <span className="font-semibold">
                      {companyRoleCounts.colab} / {collaboratorLimitLabel}
                    </span>
                  </p>
                </div>
              </div>
            }
          />

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
