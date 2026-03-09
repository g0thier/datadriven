import { ActionButton, CellInput, Th, Td, TableShell } from "./UITeam.jsx";

export default function OfficesView({
  officeLocations,
  editingOfficeId,
  setEditingOfficeId,
  addOffice,
  updateOffice,
  removeOffice,
}) {
  return (
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
                  <ActionButton
                    onClick={() => setEditingOfficeId(isEditing ? null : o.id)}
                  >
                    {isEditing ? "Voir" : "Modifier"}
                  </ActionButton>
                </Td>

                <Td>
                  {isEditing ? (
                    <CellInput
                      value={o.name ?? ""}
                      onChange={(v) => updateOffice(o.id, { name: v })}
                    />
                  ) : (
                    o.name || "—"
                  )}
                </Td>

                <Td>
                  {isEditing ? (
                    <CellInput
                      value={o.address ?? ""}
                      onChange={(v) => updateOffice(o.id, { address: v })}
                    />
                  ) : (
                    o.address || "—"
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
        </tbody>
      </table>
    </TableShell>
  );
}