import { ActionButton, CellInput, Th, Td, TableShell } from "./UITeam.jsx";

export default function DepartmentsView({
  departments,
  editingDeptId,
  setEditingDeptId,
  addDepartment,
  updateDepartment,
  removeDepartment,
}) {
  return (
    <TableShell title="Équipes" onAdd={addDepartment}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
        <thead>
          <tr>
            <Th>Modifier</Th>
            <Th>Nom</Th>
            <Th>Actif</Th>
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
                    <CellInput
                      value={d.name ?? ""}
                      onChange={(v) => updateDepartment(d.id, { name: v })}
                      placeholder="Nom"
                    />
                  ) : (
                    <span>{d.name || "—"}</span>
                  )}
                </Td>

                <Td>
                  {isEditing ? (
                    <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={Boolean(d.isActive)}
                        onChange={(e) => updateDepartment(d.id, { isActive: e.target.checked })}
                      />
                      <span>{d.isActive ? "Oui" : "Non"}</span>
                    </label>
                  ) : d.isActive ? (
                    "Oui"
                  ) : (
                    "Non"
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
              <Td colSpan={4} style={{ color: "#777" }}>
                Aucune équipe
              </Td>
            </tr>
          )}
        </tbody>
      </table>
    </TableShell>
  );
}
