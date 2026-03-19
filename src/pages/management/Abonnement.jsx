import Navbar from "../../components/Navbar.jsx";
import SectionNavButtons from "../../components/SectionNavButtons.jsx";
import { managementLinks } from "../../constants/navigationLinks.js";

const PLANS = [
  {
    name: "Hello",
    managers: 1,
    collaborators: 3,
    monthlyPrice: 0,
    previousMonthlyPrice: 24.99,
    launchLabel: "Offre de lancement",
    description: "Pack découverte",
    accent: "from-indigo-700 to-indigo-600",
  },
  {
    name: "Freelance",
    managers: 1,
    collaborators: 8,
    monthlyPrice: 99,
    description: "Le début du succès",
    isRecommended: true,
    accent: "from-indigo-700 to-indigo-600",
  },
  {
    name: "Startup",
    managers: 3,
    collaborators: 30,
    monthlyPrice: 299,
    description: "Le pilotage indispensable",
    accent: "from-indigo-800 to-indigo-600",
  },
];

const formatManagersLabel = (count) => `${count} manager${count > 1 ? "s" : ""}`;
const formatCollaboratorsLabel = (count) => `${count} collaborateur${count > 1 ? "s" : ""}`;
const formatMonthlyPriceLabel = (amount) => {
  const hasDecimals = !Number.isInteger(amount);
  const value = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${value}€`;
};

export default function Abonnement() {
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

          <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {PLANS.map((plan) => (
              <article
                key={plan.name}
                className={[
                  "group h-full overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl",
                  plan.isRecommended ? "ring-2 ring-indigo-200" : "",
                ].join(" ")}
              >
                <div
                  className={`relative h-48 overflow-hidden bg-linear-to-r ${plan.accent} p-4 text-white`}
                >
                  <div className="absolute inset-0 bg-linear-to-t from-black/25 to-transparent" />

                  {plan.launchLabel ? (
                    <span className="absolute right-3 top-3 z-10 inline-flex rounded-full bg-amber-300 px-2.5 py-1 text-xs font-semibold text-slate-900">
                      {plan.launchLabel}
                    </span>
                  ) : null}

                  {plan.isRecommended ? (
                    <span
                      className={[
                        "absolute right-3 z-10 inline-flex items-center gap-1 rounded-full bg-indigo-500/35 px-2 py-1 text-xs font-semibold",
                        plan.launchLabel ? "top-12" : "top-3",
                      ].join(" ")}
                    >
                      <span>⭐</span>
                      Recommandé
                    </span>
                  ) : null}

                  <div className="relative z-10 flex h-full flex-col justify-end">
                    <p className="pr-20 text-sm font-medium text-white/85">{plan.name}</p>
                    <p className="mt-2 text-4xl font-bold leading-none">
                      {formatMonthlyPriceLabel(plan.monthlyPrice)}
                    </p>
                    <p className="mt-1 text-sm text-white/80">
                      Prix mensuel
                      {Number.isFinite(plan.previousMonthlyPrice) ? (
                        <>
                          <span className="mx-1.5">•</span>
                          <span className="font-semibold text-white/70 line-through">
                            {formatMonthlyPriceLabel(plan.previousMonthlyPrice)}
                          </span>
                        </>
                      ) : null}
                    </p>
                  </div>
                </div>

                {/* Description et fonctionnalités */}
                <div className="space-y-4 p-6">

                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{plan.description}</span>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-700 mb-2">
                      Notre offre :
                    </p>

                    <ul className="space-y-1 text-sm text-gray-600">
                      {[
                        formatManagersLabel(plan.managers),
                        formatCollaboratorsLabel(plan.collaborators),
                      ].map((feature, index) => (
                        <li key={`${plan.name}-feature-${index}`} className="flex items-start gap-1.5">
                          <span className="mt-0.5 text-indigo-500">✔</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            ))}

            <article className="group h-full overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-white shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
              <div className="relative flex h-48 items-center justify-center bg-slate-100">
                <p className="text-sm font-semibold text-slate-500">À venir</p>
              </div>
            </article>
          </div>
        </div>
      </div>
    </>
  );
}
