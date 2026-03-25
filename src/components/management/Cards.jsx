/**
 * @module components/management/Cards
 * @description UI component module for Cards.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */
const formatOwnerLabel = (count) => `${count} administrateur${count > 1 ? "s" : ""}`;
const formatLeaderLabel = (count) => `${count} leader${count > 1 ? "s" : ""}`;
const formatColabLabel = (count) => `${count} collaborateur${count > 1 ? "s" : ""}`;

const formatMonthlyPriceLabel = (amount) => {
  const hasDecimals = !Number.isInteger(amount);
  const value = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);

  return `${value}€`;
};

/**
 * Renders the Cards component.
 * @param {Object} props - Component props.
 * @param {*} props.plans - plans prop.
 * @param {*} props.onSelectPlan - onSelectPlan prop.
 * @param {string} [props.loadingPlanName=""] - loadingPlanName prop.
 * @returns {JSX.Element|null} Rendered component output.
 *
 * @example
 * import Cards from "../components/management/Cards";
 *
 * // Real usage reference: src/pages/management/Abonnement.jsx
 * <Cards />;
 */
export default function Cards({ plans, onSelectPlan, loadingPlanName = "" }) {
  const isAnyPlanLoading = Boolean(loadingPlanName);

  return (
    <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {plans.map((plan) => {
        const isCurrentPlanLoading = loadingPlanName === plan.name;
        const isSelectionDisabled = !onSelectPlan || isAnyPlanLoading;

        const handleSelect = () => {
          if (isSelectionDisabled) return;
          onSelectPlan(plan.name);
        };

        const handleKeyDown = (event) => {
          if (isSelectionDisabled) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelectPlan(plan.name);
          }
        };

        return (
          <article
            key={plan.name}
            role="button"
            tabIndex={isSelectionDisabled ? -1 : 0}
            aria-disabled={isSelectionDisabled}
            onClick={handleSelect}
            onKeyDown={handleKeyDown}
            className={[
              "group h-full overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300",
              isSelectionDisabled
                ? "cursor-not-allowed opacity-90"
                : "cursor-pointer hover:-translate-y-2 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
              plan.isRecommended ? "ring-2 ring-indigo-200" : "",
            ].join(" ")}
          >
            <div className="relative h-48 overflow-hidden text-white">
              <img
                src={plan.image}
                alt={plan.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />

              {plan.launchLabel ? (
                <span className="absolute right-3 top-3 z-20 inline-flex rounded-full bg-amber-300 px-2.5 py-1 text-xs font-semibold text-slate-900">
                  {plan.launchLabel}
                </span>
              ) : null}

              {plan.isRecommended ? (
                <span
                  className={[
                    "absolute right-3 z-20 inline-flex items-center gap-1 rounded-full bg-indigo-500 px-2 py-1 text-xs font-semibold",
                    plan.launchLabel ? "top-12" : "top-3",
                  ].join(" ")}
                >
                  <span>⭐</span>
                  Recommandé
                </span>
              ) : null}

              <div className="absolute inset-0 z-10 flex flex-col justify-end p-4">
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

            <div className="space-y-4 p-6">
              <div className="flex justify-between text-sm text-gray-500">
                <span>{plan.description}</span>
              </div>

              <div>
                <p className="mb-2 font-semibold text-gray-700">Notre offre :</p>

                <ul className="space-y-1 text-sm text-gray-600">
                  {[
                    formatOwnerLabel(plan.owner),
                    formatLeaderLabel(plan.leader),
                    formatColabLabel(plan.colab),
                  ].map((feature, index) => (
                    <li key={`${plan.name}-feature-${index}`} className="flex items-start gap-1.5">
                      <span className="mt-0.5 text-indigo-500">✔</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div
                className={[
                  "w-full rounded-xl px-4 py-2.5 text-center text-sm font-semibold transition-colors",
                  isSelectionDisabled
                    ? "bg-slate-200 text-slate-500"
                    : "bg-indigo-500 text-white group-hover:bg-indigo-600 group-focus-visible:bg-indigo-600",
                ].join(" ")}
              >
                {isCurrentPlanLoading ? "Redirection..." : "Choisir ce plan"}
              </div>
            </div>
          </article>
        );
      })}

      <article className="group h-full overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-white shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
        <div className="relative flex h-48 items-center justify-center bg-slate-100">
          <p className="text-sm font-semibold text-slate-500">À venir</p>
        </div>
      </article>
    </div>
  );
}
