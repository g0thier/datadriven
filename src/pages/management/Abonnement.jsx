import Navbar from "../../components/Navbar.jsx";
import SectionNavButtons from "../../components/SectionNavButtons.jsx";
import MaterialIcon from "../../components/MaterialIcon.jsx";
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
    ownerLimit,
    leaderLimit,
    colabLimit,
    handleStartCheckout,
    handleOpenBillingPortal,
  } = useAbonnementPage();

  const ownerLimitLabel = ownerLimit > 0 ? ownerLimit : "-";
  const leaderLimitLabel = leaderLimit > 0 ? leaderLimit : "-";
  const colabLimitLabel = colabLimit > 0 ? colabLimit : "-";
  const capacityItems = [
    {
      id: "owner",
      icon: "workspace_premium",
      label: "Owner",
      value: `${companyRoleCounts.owner} / ${ownerLimitLabel}`,
    },
    {
      id: "leader",
      icon: "badge",
      label: "Leader",
      value: `${companyRoleCounts.leader} / ${leaderLimitLabel}`,
    },
    {
      id: "colab",
      icon: "groups",
      label: "Colab",
      value: `${companyRoleCounts.colab} / ${colabLimitLabel}`,
    },
  ];

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
                <div className="flex flex-wrap items-center gap-2.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Capacité de l&apos;abonnement
                  </p>

                  {capacityItems.map((item) => (
                    <span
                      key={item.id}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-sm text-slate-700"
                    >
                      <MaterialIcon name={item.icon} size={16} className="text-slate-500" />
                      <span className="font-medium">{item.label}</span>
                      <span className="font-semibold">{item.value}</span>
                    </span>
                  ))}
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
