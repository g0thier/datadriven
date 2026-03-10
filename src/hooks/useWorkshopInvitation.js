import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

import useCompanyTeam from "./useCompanyTeam";
import {
  normalizeDepartments,
  normalizeMembers,
  toggleInArray,
} from "../utils/workshopInvitationNormalizers";

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

  const toggleDepartment = (id) => {
    setSelectedDepartmentIds((previous) => toggleInArray(previous, id));
  };

  const toggleMember = (id) => {
    setSelectedMemberIds((previous) => toggleInArray(previous, id));
  };

  const canSend =
    Boolean(workshopDate) &&
    Boolean(workshopTime) &&
    (selectedDepartmentIds.length > 0 || selectedMemberIds.length > 0);

  const handleSendInvites = () => {
    const workshopDateTime =
      workshopDate && workshopTime ? `${workshopDate}T${workshopTime}` : "";
    const selectedDepartmentIdSet = new Set(selectedDepartmentIds.map(String));

    const membersFromSelectedDepartments = membersNormalized.filter((member) => {
      const memberDepartments = Array.isArray(member.departments) ? member.departments : [];
      return memberDepartments.some((departmentId) =>
        selectedDepartmentIdSet.has(String(departmentId))
      );
    });

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

    membersFromSelectedDepartments.forEach((member) => addRecipient(member, "department"));
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
      guestsFromSelectedDepartments: membersFromSelectedDepartments.map((member) => ({
        id: member.__id,
        label: member.__label,
      })),
      allGuests,
      officeLocations: officeLocations ?? [],
    };

    console.log("Invitations payload:", payload);
    alert(
      `Invitations prêtes à être envoyées ✅\n\nAtelier: ${atelier?.title}\nDate: ${workshopDateTime}\nÉquipes: ${selectedDepartmentIds.length}\nInvités: ${selectedMemberIds.length}`
    );
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
    toggleDepartment,
    toggleMember,
    canSend,
    handleSendInvites,
  };
}

export default useWorkshopInvitation;
