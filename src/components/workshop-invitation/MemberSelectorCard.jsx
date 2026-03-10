import SelectableCheckboxList from "./SelectableCheckboxList";

function MemberSelectorCard({
  items,
  filteredItems,
  search,
  onSearchChange,
  selectedIds,
  onToggle,
}) {
  return (
    <section className="bg-white/80 backdrop-blur rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Ajouter des invités</h3>
        <span className="text-xs rounded-full bg-slate-100 px-2 py-1 text-slate-700">
          {selectedIds.length} sélectionné(s)
        </span>
      </div>

      <div className="mb-4">
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Rechercher un membre (nom/email)…"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-slate-600">
          Aucun membre disponible (teamMembers est vide).
        </p>
      ) : (
        <>
          <SelectableCheckboxList
            items={filteredItems}
            selectedIds={selectedIds}
            onToggle={onToggle}
          />

          {filteredItems.length === 0 && (
            <p className="text-sm text-slate-600 mt-2">Aucun résultat pour “{search}”.</p>
          )}
        </>
      )}
    </section>
  );
}

export default MemberSelectorCard;
