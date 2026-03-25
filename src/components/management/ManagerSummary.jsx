/**
 * @module components/management/ManagerSummary
 * @description UI component module for ManagerSummary.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */
/**
 * Renders the ManagerSummary component.
 * @param {Object} props - Component props.
 * @param {*} props.selectedManager - selectedManager prop.
 * @param {*} props.selectedDepartmentsCount - selectedDepartmentsCount prop.
 * @param {*} props.totalDepartmentsCount - totalDepartmentsCount prop.
 * @param {*} props.selectedLevel2PagesCount - selectedLevel2PagesCount prop.
 * @param {*} props.totalLevel2PagesCount - totalLevel2PagesCount prop.
 * @returns {JSX.Element|null} Rendered component output.
 *
 * @example
 * import ManagerSummary from "../components/management/ManagerSummary";
 *
 * // Real usage reference: src/pages/management/Management.jsx
 * <ManagerSummary />;
 */
export default function ManagerSummary({
  selectedManager,
  selectedDepartmentsCount,
  totalDepartmentsCount,
  selectedLevel2PagesCount,
  totalLevel2PagesCount,
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Manager sélectionné</p>
          <h2 className="text-2xl font-bold text-slate-900">
            {selectedManager?.label.title ?? "Aucun manager"}
          </h2>
          <p className="mt-1 text-sm text-slate-600 truncate">
            {selectedManager?.label.subtitle ?? "Aucune donnée disponible."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:min-w-72">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Secteur</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {selectedDepartmentsCount}/{totalDepartmentsCount}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Pages</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {selectedLevel2PagesCount}/{totalLevel2PagesCount}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
