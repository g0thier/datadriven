import MaterialIcon from "../MaterialIcon.jsx";
import useAbonnementPage from "../../hooks/management/useAbonnementPage.js";

function toLimitLabel(value) {
  const numericValue = Number(value || 0);
  return numericValue > 0 ? numericValue : "-";
}

export default function SubscriptionCapacityInline() {
  const { companyRoleCounts, ownerLimit, leaderLimit, colabLimit } = useAbonnementPage();

  const items = [
    {
      id: "owner",
      icon: "workspace_premium",
      label: "Owner",
      value: `${Number(companyRoleCounts?.owner || 0)} / ${toLimitLabel(ownerLimit)}`,
    },
    {
      id: "leader",
      icon: "badge",
      label: "Leader",
      value: `${Number(companyRoleCounts?.leader || 0)} / ${toLimitLabel(leaderLimit)}`,
    },
    {
      id: "colab",
      icon: "groups",
      label: "Colab",
      value: `${Number(companyRoleCounts?.colab || 0)} / ${toLimitLabel(colabLimit)}`,
    },
  ];

  return (
    <div className="min-w-70 flex-1">
      <div className="rounded-xl border border-slate-200 bg-white/80 px-4 py-2">
        <div className="flex flex-wrap items-center gap-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Capacité de l&apos;abonnement
          </p>

          {items.map((item) => (
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
    </div>
  );
}
