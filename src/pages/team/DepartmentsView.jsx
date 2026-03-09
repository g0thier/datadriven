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
  );
}