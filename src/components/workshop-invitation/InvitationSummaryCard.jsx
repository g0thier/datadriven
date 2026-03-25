/**
 * @module components/workshop-invitation/InvitationSummaryCard
 * @description UI component module for InvitationSummaryCard.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */
/**
 * Renders the InvitationSummaryCard component.
 * @param {Object} props - Component props.
 * @param {*} props.workshopDate - workshopDate prop.
 * @param {*} props.workshopTime - workshopTime prop.
 * @param {*} props.selectedDepartmentCount - selectedDepartmentCount prop.
 * @param {*} props.selectedMemberCount - selectedMemberCount prop.
 * @param {*} props.totalGuestCount - totalGuestCount prop.
 * @param {*} props.canSend - canSend prop.
 * @returns {JSX.Element|null} Rendered component output.
 *
 * @example
 * import InvitationSummaryCard from "../components/workshop-invitation/InvitationSummaryCard";
 *
 * // Real usage reference: src/pages/innovation/WorkshopInvitation.jsx
 * <InvitationSummaryCard />;
 */
function InvitationSummaryCard({
  workshopDate,
  workshopTime,
  selectedDepartmentCount,
  selectedMemberCount,
  totalGuestCount,
  canSend,
}) {
  return (
    <div className="mt-6 bg-white/80 backdrop-blur rounded-2xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-3">Récapitulatif</h3>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Date et heure</p>
          <p className="text-sm font-semibold text-slate-900">
            {workshopDate && workshopTime ? `${workshopDate} ${workshopTime}` : "—"}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Équipes</p>
          <p className="text-sm font-semibold text-slate-900">
            {selectedDepartmentCount}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Invités en plus</p>
          <p className="text-sm font-semibold text-slate-900">{selectedMemberCount}</p>
        </div>

        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Total invités</p>
          <p className="text-sm font-semibold text-slate-900">{totalGuestCount}</p>
        </div>
      </div>

      {!canSend && (
        <p className="mt-4 text-sm text-slate-600">
          Pour envoyer, choisis une date + au moins une équipe ou un invité.
        </p>
      )}
    </div>
  );
}

export default InvitationSummaryCard;
