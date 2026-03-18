import Navbar from "../../components/Navbar.jsx";
import SectionNavButtons from "../../components/SectionNavButtons.jsx";
import { managementLinks } from "../../constants/navigationLinks.js";

const PLANS = [
  {
    name: "Hello",
    managers: 1,
    collaborators: 3,
    monthlyPrice: 0,
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
    description: "PME structurée",
    accent: "from-indigo-800 to-indigo-600",
  },
];

const formatManagersLabel = (count) => `${count} manager${count > 1 ? "s" : ""}`;
const formatCollaboratorsLabel = (count) => `${count} collaborateur${count > 1 ? "s" : ""}`;
const formatMonthlyPriceLabel = (amount) => `${amount}€`;

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

          <div className="grid grid-cols-5 gap-3">
            {PLANS.map((plan) => (
              <article
                key={plan.name}
                className={[
                  "group overflow-hidden rounded-xl bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
                  plan.isRecommended ? "ring-2 ring-indigo-200" : "",
                ].join(" ")}
              >
                <div
                  className={`relative bg-linear-to-r ${plan.accent} px-3 pb-3 pt-3 text-white`}
                >
                  {plan.isRecommended ? (
                    <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-indigo-500/35 px-1.5 py-0.5 text-[10px] font-semibold">
                      <span>⭐</span>
                      Recommandé
                    </span>
                  ) : null}

                  <p className="pr-12 text-xs font-medium text-white/85">{plan.name}</p>
                  <p className="mt-1 text-xl font-bold leading-none">
                    {formatMonthlyPriceLabel(plan.monthlyPrice)}
                  </p>
                  <p className="mt-1 text-[10px] text-white/80">Prix mensuel</p>
                </div>

                <div className="space-y-2 p-3">
                  <p className="text-xs leading-snug text-slate-700">{plan.description}</p>

                  <ul className="space-y-1 text-xs text-slate-700">
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
              </article>
            ))}

            <article className="flex items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-100/80 p-3 shadow-sm">
              <p className="inline-flex flex-col items-center gap-1 text-xs font-semibold text-slate-500">
                À venir
              </p>
            </article>
          </div>
        </div>
      </div>
    </>
  );
}
