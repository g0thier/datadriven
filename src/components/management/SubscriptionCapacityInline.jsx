/**
 * @module components/management/SubscriptionCapacityInline
 * @description UI component module for SubscriptionCapacityInline.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */
import { useEffect, useRef, useState } from "react";
import MaterialIcon from "../MaterialIcon.jsx";
import useAbonnementPage from "../../hooks/management/useAbonnementPage.js";

function toLimitLabel(value) {
  const numericValue = Number(value || 0);
  return numericValue > 0 ? numericValue : "-";
}

/**
 * Renders the SubscriptionCapacityInline component.
 * @returns {JSX.Element|null} Rendered component output.
 *
 * @example
 * import SubscriptionCapacityInline from "../components/management/SubscriptionCapacityInline";
 *
 * // Real usage reference: src/pages/Team.jsx
 * <SubscriptionCapacityInline />;
 */
export default function SubscriptionCapacityInline() {
  const {
    companyRoleCounts,
    ownerLimit,
    leaderLimit,
    colabLimit,
    isOwnerOverCapacity,
    isLeaderOverCapacity,
    isColabOverCapacity,
  } = useAbonnementPage();
  const [layoutMode, setLayoutMode] = useState("full");
  const rowContainerRef = useRef(null);
  const fullWidthProbeRef = useRef(null);
  const compactWidthProbeRef = useRef(null);

  const items = [
    {
      id: "owner",
      icon: "workspace_premium",
      label: "Administrateur",
      value: `${Number(companyRoleCounts?.owner || 0)} / ${toLimitLabel(ownerLimit)}`,
      isOverCapacity: isOwnerOverCapacity,
    },
    {
      id: "leader",
      icon: "badge",
      label: "Leader",
      value: `${Number(companyRoleCounts?.leader || 0)} / ${toLimitLabel(leaderLimit)}`,
      isOverCapacity: isLeaderOverCapacity,
    },
    {
      id: "colab",
      icon: "groups",
      label: "Colaborateurs",
      value: `${Number(companyRoleCounts?.colab || 0)} / ${toLimitLabel(colabLimit)}`,
      isOverCapacity: isColabOverCapacity,
    },
  ];

  useEffect(() => {
    const updateLayoutMode = () => {
      if (!rowContainerRef.current || !fullWidthProbeRef.current || !compactWidthProbeRef.current) {
        return;
      }

      const availableWidth = rowContainerRef.current.clientWidth;
      const requiredFullWidth = fullWidthProbeRef.current.scrollWidth;
      const requiredCompactWidth = compactWidthProbeRef.current.scrollWidth;

      const nextLayoutMode =
        requiredFullWidth <= availableWidth
          ? "full"
          : requiredCompactWidth <= availableWidth
            ? "compact"
            : "ultra";

      setLayoutMode((currentMode) => (currentMode === nextLayoutMode ? currentMode : nextLayoutMode));
    };

    updateLayoutMode();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateLayoutMode);
      return () => {
        window.removeEventListener("resize", updateLayoutMode);
      };
    }

    const resizeObserver = new ResizeObserver(updateLayoutMode);
    resizeObserver.observe(rowContainerRef.current);
    resizeObserver.observe(fullWidthProbeRef.current);
    resizeObserver.observe(compactWidthProbeRef.current);
    window.addEventListener("resize", updateLayoutMode);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateLayoutMode);
    };
  }, []);

  return (
    <div className="min-w-70 flex-1">
      <div className="rounded-xl border border-slate-200 bg-white/80 px-4 py-1.5 shadow-xs">
        <div ref={rowContainerRef} className="relative">
          <div className="flex flex-wrap items-center gap-2.5 sm:flex-nowrap sm:justify-between">
            {layoutMode !== "ultra" && (
              <p className="shrink-0 normal-case text-sm font-medium text-slate-500">
                Capacité de votre abonnement :
              </p>
            )}

            {items.map((item) => (
              <span
                key={item.id}
                className={[
                  "inline-flex whitespace-nowrap items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm",
                  item.isOverCapacity ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700",
                ].join(" ")}
              >
                <MaterialIcon
                  name={item.icon}
                  size={16}
                  className={item.isOverCapacity ? "text-red-700" : "text-slate-500"}
                />
                {layoutMode === "full" && <span className="font-medium">{item.label}</span>}
                <span className="font-semibold">{item.value}</span>
              </span>
            ))}
          </div>

          <div className="pointer-events-none absolute left-0 top-0 h-0 overflow-hidden opacity-0" aria-hidden="true">
            <div ref={fullWidthProbeRef} className="inline-flex items-center gap-2.5 whitespace-nowrap">
              <p className="shrink-0 normal-case text-sm font-medium">
                Capacité de votre abonnement :
              </p>
              {items.map((item) => (
                <span
                  key={`probe-${item.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm"
                >
                  <MaterialIcon name={item.icon} size={16} />
                  <span className="font-medium">{item.label}</span>
                  <span className="font-semibold">{item.value}</span>
                </span>
              ))}
            </div>
            <div ref={compactWidthProbeRef} className="inline-flex items-center gap-2.5 whitespace-nowrap">
              <p className="shrink-0 normal-case text-sm font-medium">
                Capacité de votre abonnement :
              </p>
              {items.map((item) => (
                <span
                  key={`compact-probe-${item.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm"
                >
                  <MaterialIcon name={item.icon} size={16} />
                  <span className="font-semibold">{item.value}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
