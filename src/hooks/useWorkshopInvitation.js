import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

import useCompanyTeam from "./useCompanyTeam";
import {
  normalizeDepartments,
  normalizeMembers,
  toggleInArray,
} from "../utils/workshopInvitationNormalizers";

const SEND_WORKSHOP_INVITE_URL = import.meta.env.VITE_SEND_WORKSHOP_INVITE_URL;

function useWorkshopInvitation() {
  const location = useLocation();
  const atelier = location.state?.workshop ?? { title: "Atelier" };
  const { officeLocations, departments, teamMembers } = useCompanyTeam();

  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [workshopDate, setWorkshopDate] = useState("");
  const [workshopTime, setWorkshopTime] = useState("");
  const [departmentSearch, setDepartmentSearch] = useState("");
  const [search, setSearch] = useState("");
  const [isSending, setIsSending] = useState(false);

  const departmentsNormalized = useMemo(
    () => normalizeDepartments(departments ?? []),
    [departments]
  );

  const membersNormalized = useMemo(
    () => normalizeMembers(teamMembers ?? []),
    [teamMembers]
  );

  const filteredDepartments = useMemo(() => {
    const query = departmentSearch.trim().toLowerCase();
    if (!query) return departmentsNormalized;

    return departmentsNormalized.filter((department) =>
      department.__label.toLowerCase().includes(query)
    );
  }, [departmentSearch, departmentsNormalized]);

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return membersNormalized;

    return membersNormalized.filter((member) =>
      member.__label.toLowerCase().includes(query)
    );
  }, [membersNormalized, search]);

  const selectedDepartments = useMemo(() => {
    const selectedSet = new Set(selectedDepartmentIds);
    return departmentsNormalized.filter((department) =>
      selectedSet.has(department.__id)
    );
  }, [departmentsNormalized, selectedDepartmentIds]);

  const selectedMembers = useMemo(() => {
    const selectedSet = new Set(selectedMemberIds);
    return membersNormalized.filter((member) => selectedSet.has(member.__id));
  }, [membersNormalized, selectedMemberIds]);

  const guestsFromSelectedDepartments = useMemo(() => {
    const selectedDepartmentIdSet = new Set(selectedDepartmentIds.map(String));

    return membersNormalized.filter((member) => {
      const memberDepartments = Array.isArray(member.departments) ? member.departments : [];
      return memberDepartments.some((departmentId) =>
        selectedDepartmentIdSet.has(String(departmentId))
      );
    });
  }, [membersNormalized, selectedDepartmentIds]);

  const totalUniqueGuestCount = useMemo(() => {
    const allGuestIds = new Set();

    guestsFromSelectedDepartments.forEach((member) => {
      allGuestIds.add(String(member.__id));
    });

    selectedMembers.forEach((member) => {
      allGuestIds.add(String(member.__id));
    });

    return allGuestIds.size;
  }, [guestsFromSelectedDepartments, selectedMembers]);

  const toggleDepartment = (id) => {
    setSelectedDepartmentIds((previous) => toggleInArray(previous, id));
  };

  const toggleMember = (id) => {
    setSelectedMemberIds((previous) => toggleInArray(previous, id));
  };

  const canSend =
    Boolean(workshopDate) &&
    Boolean(workshopTime) &&
    (selectedDepartmentIds.length > 0 || selectedMemberIds.length > 0) &&
    !isSending;

  const handleSendInvites = async () => {
    if (isSending || !canSend) return;

    const workshopDateTime =
      workshopDate && workshopTime ? `${workshopDate}T${workshopTime}` : "";

    const recipientsById = new Map();
    const addRecipient = (member, source) => {
      const existing = recipientsById.get(member.__id);
      if (existing) {
        existing.sources.add(source);
        return;
      }

      recipientsById.set(member.__id, {
        id: member.__id,
        label: member.__label,
        email: member.email ?? "",
        phone: member.phone ?? "",
        firstName: member.firstName ?? "",
        lastName: member.lastName ?? "",
        name: member.name ?? "",
        sources: new Set([source]),
      });
    };

    guestsFromSelectedDepartments.forEach((member) => addRecipient(member, "department"));
    selectedMembers.forEach((member) => addRecipient(member, "direct"));

    const allGuests = Array.from(recipientsById.values()).map((recipient) => ({
      ...recipient,
      sources: Array.from(recipient.sources),
    }));

    const payload = {
      atelierTitle: atelier?.title,
      date: workshopDate,
      time: workshopTime,
      datetime: workshopDateTime,
      selectedDepartments: selectedDepartments.map((department) => ({
        id: department.__id,
        label: department.__label,
      })),
      selectedGuests: selectedMembers.map((member) => ({
        id: member.__id,
        label: member.__label,
      })),
      guestsFromSelectedDepartments: guestsFromSelectedDepartments.map((member) => ({
        id: member.__id,
        label: member.__label,
      })),
      allGuests,
      officeLocations: officeLocations ?? [],
    };

    const recipientsWithEmail = allGuests.filter((guest) => guest.email);

    if (recipientsWithEmail.length === 0) {
      alert("Aucun invité sélectionné avec une adresse email valide.");
      return;
    }

    setIsSending(true);

    try {
      const [defaultOffice] = officeLocations ?? [];
      const workshopLocation = defaultOffice?.name || defaultOffice?.alias || "En ligne";
      const workshopLink = window.location.origin;

      const results = await Promise.allSettled(
        recipientsWithEmail.map((guest) =>
          fetch(SEND_WORKSHOP_INVITE_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              inviteeEmail: guest.email,
              inviteeName: guest.firstName || guest.name || guest.label,
              inviterName: "Nomades Innovation",
              workshopTitle: atelier?.title || "Atelier",
              workshopDateLabel: `${workshopDate} à ${workshopTime}`,
              workshopDuration: atelier?.duration || "50 minutes",
              workshopStartIso: workshopDateTime,
              workshopLink,
              workshopLocation,
            }),
          }).then(async (response) => {
            if (!response.ok) {
              const errorBody = await response.json().catch(() => null);
              throw new Error(errorBody?.error || `HTTP ${response.status}`);
            }
            return response.json();
          })
        )
      );

      const failedCount = results.filter((result) => result.status === "rejected").length;
      const sentCount = results.length - failedCount;

      console.log("Invitations payload:", payload);
      console.log("Invitations result:", results);

      if (failedCount === 0) {
        alert(`Invitations envoyées ✅\n\n${sentCount} email(s) envoyé(s).`);
      } else {
        alert(
          `Envoi terminé avec erreurs ⚠️\n\nSuccès: ${sentCount}\nÉchecs: ${failedCount}`
        );
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi des invitations:", error);
      alert("Impossible d'envoyer les invitations. Vérifie la fonction cloud et réessaie.");
    } finally {
      setIsSending(false);
    }
  };

  return {
    atelier,
    workshopDate,
    workshopTime,
    setWorkshopDate,
    setWorkshopTime,
    departmentSearch,
    setDepartmentSearch,
    search,
    setSearch,
    departmentsNormalized,
    filteredDepartments,
    membersNormalized,
    filteredMembers,
    selectedDepartmentIds,
    selectedMemberIds,
    totalUniqueGuestCount,
    toggleDepartment,
    toggleMember,
    canSend,
    isSending,
    handleSendInvites,
  };
}

export default useWorkshopInvitation;
