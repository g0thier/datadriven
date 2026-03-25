/**
 * @module components/team/UITeam
 * @description UI component module for UITeam.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */
import { useMemo } from "react";

/**
 * Renders the TabButton component.
 * @param {Object} props - Component props.
 * @param {*} props.active - active prop.
 * @param {*} props.onClick - onClick prop.
 * @param {*} props.children - children prop.
 * @returns {JSX.Element|null} Rendered component output.
 *
 * @example
 * import { TabButton } from "../components/team/UITeam";
 *
 * // Real usage reference: src/pages/Team.jsx
 * <TabButton />;
 */
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

/**
 * Renders the ActionButton component.
 * @param {Object} props - Component props.
 * @param {*} props.onClick - onClick prop.
 * @param {*} props.children - children prop.
 * @param {*} props.danger - danger prop.
 * @param {boolean} [props.disabled=false] - disabled prop.
 * @param {string} [props.type="button"] - type prop.
 * @returns {JSX.Element|null} Rendered component output.
 *
 * @example
 * import { ActionButton } from "../components/team/UITeam";
 *
 * // Real usage reference: src/components/team/MemberModal.jsx
 * <ActionButton />;
 */
export function ActionButton({ onClick, children, danger, disabled = false, type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "8px 10px",
        borderRadius: 10,
        border: "1px solid #ddd",
        background: danger ? "#ffecec" : "#fff",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}

/**
 * Renders the CellInput component.
 * @param {Object} props - Component props.
 * @param {*} props.value - value prop.
 * @param {*} props.onChange - onChange prop.
 * @param {*} props.placeholder - placeholder prop.
 * @returns {JSX.Element|null} Rendered component output.
 *
 * @example
 * import { CellInput } from "../components/team/UITeam";
 *
 * // Real usage reference: src/components/team/DepartmentsView.jsx
 * <CellInput />;
 */
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

/**
 * Renders the Th component.
 * @param {Object} props - Component props.
 * @param {*} props.children - children prop.
 * @returns {JSX.Element|null} Rendered component output.
 *
 * @example
 * import { Th } from "../components/team/UITeam";
 *
 * // Real usage reference: src/components/team/MembersView.jsx
 * <Th />;
 */
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

/**
 * Renders the Td component.
 * @param {Object} props - Component props.
 * @param {*} props.children - children prop.
 * @param {*} props.colSpan - colSpan prop.
 * @param {string} [props.verticalAlign="top"] - verticalAlign prop.
 * @returns {JSX.Element|null} Rendered component output.
 *
 * @example
 * import { Td } from "../components/team/UITeam";
 *
 * // Real usage reference: src/components/team/MembersView.jsx
 * <Td />;
 */
export function Td({ children, colSpan, verticalAlign = "top" }) {
  return (
    <td
      colSpan={colSpan}
      style={{
        padding: 12,
        borderBottom: "1px solid #f0f0f0",
        verticalAlign,
      }}
    >
      {children}
    </td>
  );
}

/** Office dropdown: value = officeId */
/**
 * Renders the OfficeSelect component.
 * @param {Object} props - Component props.
 * @param {*} props.value - value prop.
 * @param {*} props.officeLocations - officeLocations prop.
 * @param {*} props.onChange - onChange prop.
 * @returns {JSX.Element|null} Rendered component output.
 *
 * @example
 * import { OfficeSelect } from "../components/team/UITeam";
 *
 * // Real usage reference: src/components/team/MemberModal.jsx
 * <OfficeSelect />;
 */
export function OfficeSelect({ value, officeLocations, onChange }) {
  const v = value == null ? "" : String(value);

  return (
    <select
      value={v}
      onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
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
          {o.alias || o.name}
        </option>
      ))}
    </select>
  );
}

/** Departments tags editor: value = number[] (ids), options = [{id,name}] */
/**
 * Renders the DepartmentsTagsEditor component.
 * @param {Object} props - Component props.
 * @param {*} props.value - value prop.
 * @param {*} props.options - options prop.
 * @param {*} props.onChange - onChange prop.
 * @returns {JSX.Element|null} Rendered component output.
 *
 * @example
 * import { DepartmentsTagsEditor } from "../components/team/UITeam";
 *
 * // Real usage reference: src/components/team/MemberModal.jsx
 * <DepartmentsTagsEditor />;
 */
export function DepartmentsTagsEditor({ value, options, onChange }) {
  const selectedIds = Array.isArray(value) ? value : [];
  const opts = options ?? [];

  const byId = useMemo(() => {
    const m = new Map();
    (options ?? []).forEach((d) => m.set(d.id, d));
    return m;
  }, [options]);

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
          <span className="text-gray-500">Aucune</span>
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
          <span className="text-gray-500">Aucune option</span>
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

/**
 * Renders the TableShell component.
 * @param {Object} props - Component props.
 * @param {*} props.title - title prop.
 * @param {*} props.onAdd - onAdd prop.
 * @param {*} props.children - children prop.
 * @returns {JSX.Element|null} Rendered component output.
 *
 * @example
 * import { TableShell } from "../components/team/UITeam";
 *
 * // Real usage reference: src/components/team/MembersView.jsx
 * <TableShell />;
 */
export function TableShell({ title, onAdd, children }) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <h2 style={{ margin: 0 }}>{title}</h2>
        <ActionButton onClick={onAdd}>Ajouter</ActionButton>
      </div>

      <div
        style={{
          border: "1px solid #e5e5e5",
          borderRadius: 14,
          overflow: "hidden",
          background: "#fff",
        }}
      >
        <div style={{ overflowX: "auto" }}>{children}</div>
      </div>
    </div>
  );
}
