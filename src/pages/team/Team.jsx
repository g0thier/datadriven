import React, { useMemo, useState } from "react";
// ✅ Adapte le chemin si besoin
import {
  officeLocations as officeLocationsSeed,
  departments as departmentsSeed,
  teamMembers as teamMembersSeed,
} from "./data_corp";

function nextId(list) {
  const max = (list || []).reduce((m, x) => Math.max(m, Number(x?.id ?? 0)), 0);
  return max + 1; // on reste en number comme tes data
}

function TabButton({ active, onClick, children }) {
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

function ActionButton({ onClick, children, danger }) {
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

function CellInput({ value, onChange, placeholder }) {
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

function Th({ children }) {
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

function Td({ children, colSpan }) {
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
function OfficeSelect({ value, officeLocations, onChange }) {
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
function DepartmentsTagsEditor({ value, options, onChange }) {
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
      {/* Chips */}
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

      {/* Checklist */}
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
            <label key={d.id} style={{ display: "flex", gap: 8, alignItems: "center", padding: "4px 0" }}>
              <input type="checkbox" checked={selectedIds.includes(d.id)} onChange={() => toggle(d.id)} />
              <span>{d.name}</span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}

function TableShell({ title, onAdd, children }) {
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

export default function Team() {
  const [activeTab, setActiveTab] = useState("BUREAUX");

  const [officeLocations, setOfficeLocations] = useState(() => officeLocationsSeed || []);
  const [departments, setDepartments] = useState(() => departmentsSeed || []);
  const [teamMembers, setTeamMembers] = useState(() => teamMembersSeed || []);

  // Row editing state (id en édition)
  const [editingOfficeId, setEditingOfficeId] = useState(null);
  const [editingDeptId, setEditingDeptId] = useState(null);
  const [editingMemberId, setEditingMemberId] = useState(null);

  const officeById = useMemo(() => {
    const m = new Map();
    (officeLocations || []).forEach((o) => m.set(o.id, o));
    return m;
  }, [officeLocations]);

  const deptById = useMemo(() => {
    const m = new Map();
    (departments || []).forEach((d) => m.set(d.id, d));
    return m;
  }, [departments]);

  // ------- BUREAUX -------
  function addOffice() {
    const id = nextId(officeLocations);
    setOfficeLocations((prev) => [...prev, { id, name: "", address: "" }]);
    setEditingOfficeId(id);
  }

  function updateOffice(id, patch) {
    setOfficeLocations((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  }

  function removeOffice(id) {
    setOfficeLocations((prev) => prev.filter((o) => o.id !== id));
    if (editingOfficeId === id) setEditingOfficeId(null);

    // Optionnel: nettoyer les membres qui pointaient vers ce bureau
    setTeamMembers((prev) => prev.map((m) => (m.office === id ? { ...m, office: null } : m)));
  }

  // ------- EQUIPES (departments) -------
  function addDepartment() {
    const id = nextId(departments);
    setDepartments((prev) => [...prev, { id, name: "" }]);
    setEditingDeptId(id);
  }

  function updateDepartment(id, patch) {
    setDepartments((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  }

  function removeDepartment(id) {
    setDepartments((prev) => prev.filter((d) => d.id !== id));
    if (editingDeptId === id) setEditingDeptId(null);

    // Optionnel: retirer ce dept de tous les membres
    setTeamMembers((prev) =>
      prev.map((m) => ({
        ...m,
        departments: Array.isArray(m.departments) ? m.departments.filter((x) => x !== id) : [],
      }))
    );
  }

  // ------- PERSONNELS (teamMembers) -------
  function addMember() {
    const id = nextId(teamMembers);
    setTeamMembers((prev) => [
      ...prev,
      {
        id,
        name: "",
        role: "",
        email: "",
        phone: "",
        departments: [],
        office: null, // id bureau
      },
    ]);
    setEditingMemberId(id);
  }

  function updateMember(id, patch) {
    setTeamMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }

  function removeMember(id) {
    setTeamMembers((prev) => prev.filter((m) => m.id !== id));
    if (editingMemberId === id) setEditingMemberId(null);
  }

  return (
    <div style={{ padding: 16, display: "grid", gap: 16 }}>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <TabButton active={activeTab === "BUREAUX"} onClick={() => setActiveTab("BUREAUX")}>
          Bureaux
        </TabButton>
        <TabButton active={activeTab === "EQUIPES"} onClick={() => setActiveTab("EQUIPES")}>
          Équipes
        </TabButton>
        <TabButton active={activeTab === "PERSONNELS"} onClick={() => setActiveTab("PERSONNELS")}>
          Personnels
        </TabButton>
      </div>

      {/* BUREAUX */}
      {activeTab === "BUREAUX" && (
        <TableShell title="Bureaux" onAdd={addOffice}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
            <thead>
              <tr>
                <Th>Modifier</Th>
                <Th>Nom</Th>
                <Th>Adresse</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {(officeLocations || []).map((o) => {
                const isEditing = editingOfficeId === o.id;
                return (
                  <tr key={o.id}>
                    <Td>
                      <ActionButton onClick={() => setEditingOfficeId(isEditing ? null : o.id)}>
                        {isEditing ? "Voir" : "Modifier"}
                      </ActionButton>
                    </Td>

                    <Td>
                      {isEditing ? (
                        <CellInput value={o.name ?? ""} onChange={(v) => updateOffice(o.id, { name: v })} placeholder="Nom" />
                      ) : (
                        <span>{o.name || "—"}</span>
                      )}
                    </Td>

                    <Td style={{ minWidth: 420 }}>
                      {isEditing ? (
                        <CellInput
                          value={o.address ?? ""}
                          onChange={(v) => updateOffice(o.id, { address: v })}
                          placeholder="Adresse"
                        />
                      ) : (
                        <span>{o.address || "—"}</span>
                      )}
                    </Td>

                    <Td>
                      <ActionButton danger onClick={() => removeOffice(o.id)}>
                        Supprimer
                      </ActionButton>
                    </Td>
                  </tr>
                );
              })}
              {(!officeLocations || officeLocations.length === 0) && (
                <tr>
                  <Td colSpan={4} style={{ color: "#777" }}>
                    Aucun bureau
                  </Td>
                </tr>
              )}
            </tbody>
          </table>
        </TableShell>
      )}

      {/* EQUIPES */}
      {activeTab === "EQUIPES" && (
        <TableShell title="Équipes" onAdd={addDepartment}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
            <thead>
              <tr>
                <Th>Modifier</Th>
                <Th>Nom</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {(departments || []).map((d) => {
                const isEditing = editingDeptId === d.id;
                return (
                  <tr key={d.id}>
                    <Td>
                      <ActionButton onClick={() => setEditingDeptId(isEditing ? null : d.id)}>
                        {isEditing ? "Voir" : "Modifier"}
                      </ActionButton>
                    </Td>

                    <Td>
                      {isEditing ? (
                        <CellInput value={d.name ?? ""} onChange={(v) => updateDepartment(d.id, { name: v })} placeholder="Nom" />
                      ) : (
                        <span>{d.name || "—"}</span>
                      )}
                    </Td>

                    <Td>
                      <ActionButton danger onClick={() => removeDepartment(d.id)}>
                        Supprimer
                      </ActionButton>
                    </Td>
                  </tr>
                );
              })}
              {(!departments || departments.length === 0) && (
                <tr>
                  <Td colSpan={3} style={{ color: "#777" }}>
                    Aucune équipe
                  </Td>
                </tr>
              )}
            </tbody>
          </table>
        </TableShell>
      )}

      {/* PERSONNELS */}
      {activeTab === "PERSONNELS" && (
        <TableShell title="Personnels" onAdd={addMember}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1200 }}>
            <thead>
              <tr>
                <Th>Modifier</Th>
                <Th>Nom</Th>
                <Th>Rôle</Th>
                <Th>Email</Th>
                <Th>Téléphone</Th>
                <Th>Bureau</Th>
                <Th>Équipes (tags)</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {(teamMembers || []).map((m) => {
                const isEditing = editingMemberId === m.id;
                const officeLabel = m.office ? officeById.get(m.office)?.name : "";
                const deptLabels = (m.departments || [])
                  .map((id) => deptById.get(id)?.name)
                  .filter(Boolean);

                return (
                  <tr key={m.id}>
                    <Td>
                      <ActionButton onClick={() => setEditingMemberId(isEditing ? null : m.id)}>
                        {isEditing ? "Voir" : "Modifier"}
                      </ActionButton>
                    </Td>

                    <Td style={{ minWidth: 220 }}>
                      {isEditing ? (
                        <CellInput value={m.name ?? ""} onChange={(v) => updateMember(m.id, { name: v })} placeholder="Nom" />
                      ) : (
                        <span>{m.name || "—"}</span>
                      )}
                    </Td>

                    <Td style={{ minWidth: 220 }}>
                      {isEditing ? (
                        <CellInput value={m.role ?? ""} onChange={(v) => updateMember(m.id, { role: v })} placeholder="Rôle" />
                      ) : (
                        <span>{m.role || "—"}</span>
                      )}
                    </Td>

                    <Td style={{ minWidth: 220 }}>
                      {isEditing ? (
                        <CellInput value={m.email ?? ""} onChange={(v) => updateMember(m.id, { email: v })} placeholder="Email" />
                      ) : (
                        <span>{m.email || "—"}</span>
                      )}
                    </Td>

                    <Td style={{ minWidth: 170 }}>
                      {isEditing ? (
                        <CellInput
                          value={m.phone ?? ""}
                          onChange={(v) => updateMember(m.id, { phone: v })}
                          placeholder="Téléphone"
                        />
                      ) : (
                        <span>{m.phone || "—"}</span>
                      )}
                    </Td>

                    <Td style={{ minWidth: 240 }}>
                      {isEditing ? (
                        <OfficeSelect
                          value={m.office ?? null}
                          officeLocations={officeLocations}
                          onChange={(v) => updateMember(m.id, { office: v })}
                        />
                      ) : (
                        <span>{officeLabel || "—"}</span>
                      )}
                    </Td>

                    <Td style={{ minWidth: 320 }}>
                      {isEditing ? (
                        <DepartmentsTagsEditor
                          value={m.departments ?? []}
                          options={departments}
                          onChange={(ids) => updateMember(m.id, { departments: ids })}
                        />
                      ) : (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {deptLabels.length === 0 ? (
                            <span style={{ color: "#777" }}>Aucun</span>
                          ) : (
                            deptLabels.map((t) => (
                              <span
                                key={t}
                                style={{
                                  padding: "4px 8px",
                                  borderRadius: 999,
                                  border: "1px solid #ddd",
                                  background: "#f7f7f7",
                                }}
                              >
                                {t}
                              </span>
                            ))
                          )}
                        </div>
                      )}
                    </Td>

                    <Td>
                      <ActionButton danger onClick={() => removeMember(m.id)}>
                        Supprimer
                      </ActionButton>
                    </Td>
                  </tr>
                );
              })}
              {(!teamMembers || teamMembers.length === 0) && (
                <tr>
                  <Td colSpan={8} style={{ color: "#777" }}>
                    Aucun personnel
                  </Td>
                </tr>
              )}
            </tbody>
          </table>
        </TableShell>
      )}
    </div>
  );
}