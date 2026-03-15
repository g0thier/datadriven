import {
  ActionButton,
  Th,
  Td,
  TableShell,
} from "./UITeam.jsx";
import { useState } from "react";
import MemberModal from "./MemberModal.jsx";

const EMPTY_MEMBER_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  office: null,
  departments: [],
};

function normalizeMemberForm(member = {}) {
  return {
    firstName: member.firstName || "",
    lastName: member.lastName || "",
    email: member.email || "",
    phone: member.phone || "",
    office: member.office ?? null,
    departments: Array.isArray(member.departments) ? member.departments : [],
  };
}

function toErrorMessage(error) {
  if (error?.code === "auth/email-already-in-use") {
    return "Un compte avec cet email existe déjà.";
  }

  if (error?.code === "auth/invalid-email") {
    return "L'email saisi est invalide.";
  }

  if (error?.code === "auth/weak-password") {
    return "Le mot de passe généré n'est pas accepté. Réessaie.";
  }

  return error?.message || "Une erreur est survenue.";
}

export default function MembersView({
  teamMembers,
  addMember,
  updateMember,
  removeMember,
  officeLocations,
  departments,
  officeById,
  deptById,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [form, setForm] = useState(EMPTY_MEMBER_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  function openCreateModal() {
    setModalMode("create");
    setSelectedMemberId(null);
    setForm(EMPTY_MEMBER_FORM);
    setSubmitError("");
    setIsModalOpen(true);
  }

  function openEditModal(member) {
    setModalMode("edit");
    setSelectedMemberId(member.id);
    setForm(normalizeMemberForm(member));
    setSubmitError("");
    setIsModalOpen(true);
  }

  function closeModal() {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setSubmitError("");
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    if (isSubmitting) return;
    setSubmitError("");

    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      office: form.office || null,
      departments: Array.isArray(form.departments) ? form.departments : [],
    };

    if (!payload.email) {
      setSubmitError("L'email est requis.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (modalMode === "create") {
        await addMember({
          ...payload,
          role: "colab",
          isActive: true,
        });
      } else if (selectedMemberId) {
        await updateMember(selectedMemberId, payload);
      }

      setIsModalOpen(false);
    } catch (error) {
      setSubmitError(toErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (isSubmitting) return;
    if (modalMode !== "edit" || !selectedMemberId) {
      closeModal();
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      await removeMember(selectedMemberId);
      setIsModalOpen(false);
    } catch (error) {
      setSubmitError(toErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <TableShell title="Personnels" onAdd={openCreateModal}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1360 }}>
        <thead>
          <tr>
            <Th>Modifier</Th>
            <Th>Prénom</Th>
            <Th>Nom</Th>
            <Th>Email</Th>
            <Th>Téléphone</Th>
            <Th>Bureau</Th>
            <Th>Équipes (tags)</Th>
          </tr>
        </thead>

        <tbody>
          {(teamMembers || []).map((m, index) => {
            const officeLabel = m.office
              ? officeById.get(m.office)?.alias || officeById.get(m.office)?.name
              : "";
            const deptLabels = (m.departments || [])
              .map((id) => deptById.get(id)?.name)
              .filter(Boolean);

            return (
              <tr key={m.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                <Td>
                  <ActionButton onClick={() => openEditModal(m)}>Modifier</ActionButton>
                </Td>

                <Td style={{ minWidth: 180 }}>
                  <span>{m.firstName || "—"}</span>
                </Td>

                <Td style={{ minWidth: 180 }}>
                  <span>{m.lastName || "—"}</span>
                </Td>

                <Td style={{ minWidth: 220 }}>
                  <span>{m.email || "—"}</span>
                </Td>

                <Td style={{ minWidth: 170 }}>
                  <span>{m.phone || "—"}</span>
                </Td>

                <Td style={{ minWidth: 240 }}>
                  <span>{officeLabel || "—"}</span>
                </Td>

                <Td style={{ minWidth: 320 }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {deptLabels.length === 0 ? (
                      <span className="text-gray-500">Aucun</span>
                    ) : (
                      deptLabels.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-1 rounded-full border border-violet-300 bg-violet-100"
                        >
                          {t}
                        </span>
                      ))
                    )}
                  </div>
                </Td>
              </tr>
            );
          })}

          {(!teamMembers || teamMembers.length === 0) && (
            <tr>
              <Td colSpan={9} className="text-gray-500">
                Aucun personnel
              </Td>
            </tr>
          )}
        </tbody>
      </table>

      <MemberModal
        isOpen={isModalOpen}
        mode={modalMode}
        form={form}
        onChangeField={updateField}
        officeLocations={officeLocations}
        departments={departments}
        submitError={submitError}
        isSubmitting={isSubmitting}
        onDelete={handleDelete}
        onCancel={closeModal}
        onSubmit={handleSubmit}
      />
    </TableShell>
  );
}
