function SelectableCheckboxList({ items, selectedIds, onToggle }) {
  return (
    <div className="space-y-2 max-h-90 overflow-auto pr-1">
      {items.map((item) => {
        const checked = selectedIds.includes(item.__id);

        return (
          <label
            key={item.__id}
            className={[
              "flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer",
              checked
                ? "border-slate-900 bg-slate-50"
                : "border-slate-200 bg-white hover:bg-slate-50",
            ].join(" ")}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(item.__id)}
              className="h-4 w-4"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{item.__label}</p>
            </div>
          </label>
        );
      })}
    </div>
  );
}

export default SelectableCheckboxList;
