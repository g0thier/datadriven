/**
 * @module components/team/MemberModal
 * @description UI component module for MemberModal.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */
import {
  ActionButton,
  CellInput,
  OfficeSelect,
  DepartmentsTagsEditor,
} from "./UITeam.jsx";

/**
 * Renders the MemberModal component.
 * @param {Object} props - Component props.
 * @param {*} props.isOpen - isOpen prop.
 * @param {*} props.mode - mode prop.
 * @param {*} props.form - form prop.
 * @param {boolean} [props.hideDeleteButton=false] - hideDeleteButton prop.
 * @param {*} props.onChangeField - onChangeField prop.
 * @param {*} props.officeLocations - officeLocations prop.
 * @param {*} props.departments - departments prop.
 * @param {*} props.submitError - submitError prop.
 * @param {*} props.isSubmitting - isSubmitting prop.
 * @param {*} props.onDelete - onDelete prop.
 * @param {*} props.onCancel - onCancel prop.
 * @param {*} props.onSubmit - onSubmit prop.
 * @returns {JSX.Element|null} Rendered component output.
 *
 * @example
 * import MemberModal from "../components/team/MemberModal";
 *
 * // Real usage reference: src/components/team/MembersView.jsx
 * <MemberModal />;
 */
export default function MemberModal({
  isOpen,
  mode,
  form,
  hideDeleteButton = false,
  onChangeField,
  officeLocations,
  departments,
  submitError,
  isSubmitting,
  onDelete,
  onCancel,
  onSubmit,
}) {
  if (!isOpen) return null;

  const modalActionLabel = mode === "create" ? "Créer" : "Modifier";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 10000,
      }}
    >
      <div
        style={{
          width: "min(760px, 100%)",
          background: "#fff",
          borderRadius: 16,
          border: "1px solid #e5e5e5",
          boxShadow: "0 24px 50px rgba(0, 0, 0, 0.2)",
          padding: 20,
          display: "grid",
          gap: 14,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <h3 style={{ margin: 0, fontSize: 24 }}>
          {mode === "create" ? "Créer un membre" : "Modifier un membre"}
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          <CellInput
            value={form.firstName}
            onChange={(value) => onChangeField("firstName", value)}
            placeholder="Prénom"
          />
          <CellInput
            value={form.lastName}
            onChange={(value) => onChangeField("lastName", value)}
            placeholder="Nom"
          />
          <CellInput
            value={form.email}
            onChange={(value) => onChangeField("email", value)}
            placeholder="Email *"
          />
          <CellInput
            value={form.phone}
            onChange={(value) => onChangeField("phone", value)}
            placeholder="Téléphone"
          />
        </div>

        <div>
          <label
            style={{
              display: "grid",
              gap: 6,
              fontWeight: 600,
            }}
          >
            Bureau
            <OfficeSelect
              value={form.office}
              officeLocations={officeLocations}
              onChange={(value) => onChangeField("office", value)}
            />
          </label>
        </div>

        <div>
          <label
            style={{
              display: "grid",
              gap: 6,
              fontWeight: 600,
            }}
          >
            Équipes
            <DepartmentsTagsEditor
              value={form.departments}
              options={departments}
              onChange={(value) => onChangeField("departments", value)}
            />
          </label>
        </div>

        {submitError && (
          <div
            style={{
              border: "1px solid #fecaca",
              background: "#fef2f2",
              color: "#991b1b",
              borderRadius: 10,
              padding: "10px 12px",
              fontSize: 14,
            }}
          >
            {submitError}
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: hideDeleteButton ? "flex-end" : "space-between",
            gap: 10,
          }}
        >
          {!hideDeleteButton ? (
            <ActionButton
              danger
              onClick={onDelete}
              disabled={isSubmitting}
            >
              Supprimer
            </ActionButton>
          ) : null}

          <div style={{ display: "flex", gap: 10 }}>
            <ActionButton onClick={onCancel} disabled={isSubmitting}>
              Annuler
            </ActionButton>
            <ActionButton onClick={onSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Envoi..." : modalActionLabel}
            </ActionButton>
          </div>
        </div>
      </div>
    </div>
  );
}
