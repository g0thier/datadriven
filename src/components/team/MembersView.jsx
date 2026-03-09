import {
  ActionButton,
  CellInput,
  Th,
  Td,
  OfficeSelect,
  DepartmentsTagsEditor,
  TableShell,
} from "./UITeam.jsx";

export default function MembersView({
  teamMembers,
  editingMemberId,
  setEditingMemberId,
  addMember,
  updateMember,
  removeMember,
  officeLocations,
  departments,
  officeById,
  deptById,
}) {
  return (
    <TableShell title="Personnels" onAdd={addMember}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1360 }}>
        <thead>
          <tr>
            <Th>Modifier</Th>
            <Th>Prénom</Th>
            <Th>Nom</Th>
            <Th>Rôle</Th>
            <Th>Email</Th>
            <Th>Téléphone</Th>
            <Th>Actif</Th>
            <Th>Bureau</Th>
            <Th>Équipes (tags)</Th>
            <Th>Actions</Th>
          </tr>
        </thead>

        <tbody>
          {(teamMembers || []).map((m) => {
            const isEditing = editingMemberId === m.id;
            const officeLabel = m.office
              ? officeById.get(m.office)?.alias || officeById.get(m.office)?.name
              : "";
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

                <Td style={{ minWidth: 180 }}>
                  {isEditing ? (
                    <CellInput
                      value={m.firstName ?? ""}
                      onChange={(v) => updateMember(m.id, { firstName: v })}
                      placeholder="Prénom"
                    />
                  ) : (
                    <span>{m.firstName || "—"}</span>
                  )}
                </Td>

                <Td style={{ minWidth: 180 }}>
                  {isEditing ? (
                    <CellInput
                      value={m.lastName ?? ""}
                      onChange={(v) => updateMember(m.id, { lastName: v })}
                      placeholder="Nom"
                    />
                  ) : (
                    <span>{m.lastName || "—"}</span>
                  )}
                </Td>

                <Td style={{ minWidth: 180 }}>
                  {isEditing ? (
                    <CellInput
                      value={m.role ?? ""}
                      onChange={(v) => updateMember(m.id, { role: v })}
                      placeholder="Rôle"
                    />
                  ) : (
                    <span>{m.role || "—"}</span>
                  )}
                </Td>

                <Td style={{ minWidth: 220 }}>
                  {isEditing ? (
                    <CellInput
                      value={m.email ?? ""}
                      onChange={(v) => updateMember(m.id, { email: v })}
                      placeholder="Email"
                    />
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

                <Td style={{ minWidth: 120 }}>
                  {isEditing ? (
                    <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={Boolean(m.isActive)}
                        onChange={(e) => updateMember(m.id, { isActive: e.target.checked })}
                      />
                      <span>{m.isActive ? "Oui" : "Non"}</span>
                    </label>
                  ) : m.isActive ? (
                    <span>Oui</span>
                  ) : (
                    <span>Non</span>
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
              <Td colSpan={10} style={{ color: "#777" }}>
                Aucun personnel
              </Td>
            </tr>
          )}
        </tbody>
      </table>
    </TableShell>
  );
}
