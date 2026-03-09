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
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1200 }}>
        <thead>
          <tr>
            <Th>Modifier</Th>
            <Th>Alias</Th>
            <Th>Adresse</Th>
            <Th>Ville</Th>
            <Th>NPA</Th>
            <Th>Pays</Th>
            <Th>Principal</Th>
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
                      value={o.alias ?? o.name ?? ""}
                      onChange={(v) => updateOffice(o.id, { alias: v })}
                    />
                  ) : (
                    o.alias || o.name || "—"
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
                  {isEditing ? (
                    <CellInput
                      value={o.city ?? ""}
                      onChange={(v) => updateOffice(o.id, { city: v })}
                    />
                  ) : (
                    o.city || "—"
                  )}
                </Td>

                <Td>
                  {isEditing ? (
                    <CellInput
                      value={o.zip ?? ""}
                      onChange={(v) => updateOffice(o.id, { zip: v })}
                    />
                  ) : (
                    o.zip || "—"
                  )}
                </Td>

                <Td>
                  {isEditing ? (
                    <CellInput
                      value={o.country ?? ""}
                      onChange={(v) => updateOffice(o.id, { country: v })}
                    />
                  ) : (
                    o.country || "—"
                  )}
                </Td>

                <Td>
                  {isEditing ? (
                    <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={Boolean(o.isDefault)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateOffice(o.id, { isDefault: true });
                          }
                        }}
                      />
                      <span>{o.isDefault ? "Oui" : "Non"}</span>
                    </label>
                  ) : o.isDefault ? (
                    "Oui"
                  ) : (
                    "Non"
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
