import SelectableCheckboxList from "./SelectableCheckboxList";

function DepartmentSelectorCard({ items, selectedIds, onToggle }) {
  return (
    <section className="bg-white/80 backdrop-blur rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Inviter des équipes</h3>
        <span className="text-xs rounded-full bg-slate-100 px-2 py-1 text-slate-700">
          {selectedIds.length} sélectionnée(s)
        </span>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-slate-600">
          Aucun département disponible (departments est vide).
        </p>
      ) : (
        <SelectableCheckboxList
          items={items}
          selectedIds={selectedIds}
          onToggle={onToggle}
        />
      )}
    </section>
  );
}

export default DepartmentSelectorCard;
