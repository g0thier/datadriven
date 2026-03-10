function InvitationSummaryCard({
  workshopDate,
  workshopTime,
  selectedDepartmentCount,
  selectedMemberCount,
  canSend,
}) {
  return (
    <div className="mt-6 bg-white/80 backdrop-blur rounded-2xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-3">Récapitulatif</h3>

      <div className="grid gap-4 sm:grid-cols-3">
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
          <p className="text-xs text-slate-500">Invités</p>
          <p className="text-sm font-semibold text-slate-900">{selectedMemberCount}</p>
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
