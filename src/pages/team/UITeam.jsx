import React, { useMemo } from "react";

export function nextId(list) {
  const max = (list || []).reduce((m, x) => Math.max(m, Number(x?.id ?? 0)), 0);
  return max + 1; // on reste en number comme tes data
}

export function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid #ddd",
        background: active ? "#111" : "#fff",
        color: active ? "#fff" : "#111",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

export function ActionButton({ onClick, children, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "8px 10px",
        borderRadius: 10,
        border: "1px solid #ddd",
        background: danger ? "#ffecec" : "#fff",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

export function CellInput({ value, onChange, placeholder }) {
  return (
    <input
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        padding: "8px 10px",
        borderRadius: 10,
        border: "1px solid #ddd",
      }}
    />
  );
}

export function Th({ children }) {
  return (
    <th
      style={{
        textAlign: "left",
        padding: 12,
        background: "#fafafa",
        borderBottom: "1px solid #eee",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </th>
  );
}

export function Td({ children, colSpan }) {
  return (
    <td
      colSpan={colSpan}
      style={{
        padding: 12,
        borderBottom: "1px solid #f0f0f0",
        verticalAlign: "top",
      }}
    >
      {children}
    </td>
  );
}

/** Office dropdown: value = officeId */
export function OfficeSelect({ value, officeLocations, onChange }) {
  const v = value == null ? "" : String(value);

  return (
    <select
      value={v}
      onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
      style={{
        width: "100%",
        padding: "8px 10px",
        borderRadius: 10,
        border: "1px solid #ddd",
        background: "#fff",
      }}
    >
      <option value="">—</option>
      {(officeLocations || []).map((o) => (
        <option key={o.id} value={String(o.id)}>
          {o.name}
        </option>
      ))}
    </select>
  );
}

/** Departments tags editor: value = number[] (ids), options = [{id,name}] */
export function DepartmentsTagsEditor({ value, options, onChange }) {
  const selectedIds = Array.isArray(value) ? value : [];
  const opts = options || [];

  const byId = useMemo(() => {
    const m = new Map();
    opts.forEach((d) => m.set(d.id, d));
    return m;
  }, [opts]);

  function toggle(id) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {selectedIds.length === 0 ? (
          <span style={{ color: "#777" }}>Aucun</span>
        ) : (
          selectedIds.map((id) => {
            const label = byId.get(id)?.name ?? `Dept ${id}`;
            return (
              <span
                key={id}
                style={{
                  padding: "4px 8px",
                  borderRadius: 999,
                  border: "1px solid #ddd",
                  background: "#f7f7f7",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {label}
                <button
                  type="button"
                  onClick={() => toggle(id)}
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                  aria-label={`Retirer ${label}`}
                >
                  ×
                </button>
              </span>
            );
          })
        )}
      </div>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 10,
          padding: 10,
          maxHeight: 160,
          overflow: "auto",
        }}
      >
        {opts.length === 0 ? (
          <div style={{ color: "#777" }}>Aucune option</div>
        ) : (
          opts.map((d) => (
            <label
              key={d.id}
              style={{ display: "flex", gap: 8, alignItems: "center", padding: "4px 0" }}
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(d.id)}
                onChange={() => toggle(d.id)}
              />
              <span>{d.name}</span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}

export function TableShell({ title, onAdd, children }) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <h2 style={{ margin: 0 }}>{title}</h2>
        <ActionButton onClick={onAdd}>Ajouter</ActionButton>
      </div>

      <div style={{ border: "1px solid #e5e5e5", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>{children}</div>
      </div>
    </div>
  );
}