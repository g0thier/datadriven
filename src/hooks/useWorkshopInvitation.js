import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

import {
  officeLocations,
  departments,
  teamMembers,
} from "../pages/management/data_corp.jsx";
import {
  normalizeDepartments,
  normalizeMembers,
  toggleInArray,
} from "../utils/workshopInvitationNormalizers";

function useWorkshopInvitation() {
  const location = useLocation();
  const atelier = location.state?.workshop ?? { title: "Atelier" };

  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [workshopDate, setWorkshopDate] = useState("");
  const [workshopTime, setWorkshopTime] = useState("");
  const [search, setSearch] = useState("");

  const departmentsNormalized = useMemo(
    () => normalizeDepartments(departments ?? []),
    []
  );

  const membersNormalized = useMemo(() => normalizeMembers(teamMembers ?? []), []);

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

    const payload = {
      atelierTitle: atelier?.title,
      date: workshopDate,
      time: workshopTime,
      datetime: workshopDateTime,
      departments: selectedDepartments.map((department) => ({
        id: department.__id,
        label: department.__label,
      })),
      guests: selectedMembers.map((member) => ({
        id: member.__id,
        label: member.__label,
      })),
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
    search,
    setSearch,
    departmentsNormalized,
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
