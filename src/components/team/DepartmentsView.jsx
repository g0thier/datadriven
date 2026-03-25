/**
 * @module components/team/DepartmentsView
 * @description UI component module for DepartmentsView.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */
import { ActionButton, CellInput, Th, Td, TableShell } from "./UITeam.jsx";

/**
 * Renders the DepartmentsView component.
 * @param {Object} props - Component props.
 * @param {*} props.departments - departments prop.
 * @param {*} props.editingDeptId - editingDeptId prop.
 * @param {*} props.setEditingDeptId - setEditingDeptId prop.
 * @param {*} props.addDepartment - addDepartment prop.
 * @param {*} props.updateDepartment - updateDepartment prop.
 * @param {*} props.removeDepartment - removeDepartment prop.
 * @returns {JSX.Element|null} Rendered component output.
 *
 * @example
 * import DepartmentsView from "../components/team/DepartmentsView";
 *
 * // Real usage reference: src/pages/Team.jsx
 * <DepartmentsView />;
 */
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
          {(departments || []).map((d, index) => {
            const isEditing = editingDeptId === d.id;

            return (
              <tr key={d.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                <Td verticalAlign="middle">
                  <ActionButton onClick={() => setEditingDeptId(isEditing ? null : d.id)}>
                    {isEditing ? "Voir" : "Modifier"}
                  </ActionButton>
                </Td>

                <Td verticalAlign="middle">
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

                <Td verticalAlign="middle">
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

                <Td verticalAlign="middle">
                  <ActionButton danger onClick={() => removeDepartment(d.id)}>
                    Supprimer
                  </ActionButton>
                </Td>
              </tr>
            );
          })}

          {(!departments || departments.length === 0) && (
            <tr>
              <Td colSpan={4} verticalAlign="middle" style={{ color: "#777" }}>
                Aucune équipe
              </Td>
            </tr>
          )}
        </tbody>
      </table>
    </TableShell>
  );
}
