import { useEffect, useMemo, useState } from "react";
import {
  createDepartment,
  createMember,
  createOffice,
  deleteDepartment,
  deleteMember,
  deleteOffice,
  editDepartment,
  editMember,
  editOffice,
  getUserCompanyId,
  onAuthStateChangedListener,
  watchCompanyDepartments,
  watchCompanyMembers,
  watchCompanyOffices,
} from "../services/teamService";

export default function useCompanyTeam() {
  const [officeLocations, setOfficeLocations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [companyId, setCompanyId] = useState(null);

  const [editingOfficeId, setEditingOfficeId] = useState(null);
  const [editingDeptId, setEditingDeptId] = useState(null);
  const [editingMemberId, setEditingMemberId] = useState(null);

  const officeById = useMemo(() => {
    const map = new Map();
    (officeLocations || []).forEach((office) => map.set(office.id, office));
    return map;
  }, [officeLocations]);

  const deptById = useMemo(() => {
    const map = new Map();
    (departments || []).forEach((dept) => map.set(dept.id, dept));
    return map;
  }, [departments]);

  useEffect(() => {
    const unsubscribe = onAuthStateChangedListener(async (currentUser) => {
      if (!currentUser) {
        setCompanyId(null);
        setOfficeLocations([]);
        setDepartments([]);
        setTeamMembers([]);
        return;
      }

      try {
        const nextCompanyId = await getUserCompanyId(currentUser.uid);
        setCompanyId(nextCompanyId || null);

        if (!nextCompanyId) {
          setOfficeLocations([]);
          setDepartments([]);
          setTeamMembers([]);
        }
      } catch (error) {
        console.error("Impossible de récupérer le companyId de l'utilisateur :", error);
        setCompanyId(null);
        setOfficeLocations([]);
        setDepartments([]);
        setTeamMembers([]);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = watchCompanyOffices(companyId, setOfficeLocations);
    return () => unsubscribe();
  }, [companyId]);

  useEffect(() => {
    const unsubscribe = watchCompanyDepartments(companyId, setDepartments);
    return () => unsubscribe();
  }, [companyId]);

  useEffect(() => {
    const unsubscribe = watchCompanyMembers(companyId, setTeamMembers);
    return () => unsubscribe();
  }, [companyId]);

  async function addOffice() {
    if (!companyId) return;

    try {
      const id = await createOffice(companyId);
      setEditingOfficeId(id);
    } catch (error) {
      console.error("Impossible d'ajouter le bureau :", error);
    }
  }

  async function updateOffice(id, patch) {
    setOfficeLocations((prev) =>
      prev.map((office) => {
        if (office.id === id) {
          return {
            ...office,
            ...patch,
            ...(Object.prototype.hasOwnProperty.call(patch, "alias") ? { name: patch.alias } : {}),
            ...(Object.prototype.hasOwnProperty.call(patch, "name") ? { alias: patch.name } : {}),
          };
        }

        if (patch.isDefault === true) {
          return { ...office, isDefault: false };
        }

        return office;
      })
    );

    if (!companyId) return;

    try {
      await editOffice(companyId, id, patch);
    } catch (error) {
      console.error("Impossible de modifier le bureau :", error);
    }
  }

  async function removeOffice(id) {
    setOfficeLocations((prev) => prev.filter((office) => office.id !== id));
    if (editingOfficeId === id) setEditingOfficeId(null);

    setTeamMembers((prev) =>
      prev.map((member) =>
        String(member.office) === String(id) ? { ...member, office: null } : member
      )
    );

    if (!companyId) return;

    try {
      await deleteOffice(companyId, id);
    } catch (error) {
      console.error("Impossible de supprimer le bureau :", error);
    }
  }

  async function addDepartment() {
    if (!companyId) return;

    try {
      const id = await createDepartment(companyId);
      setEditingDeptId(id);
    } catch (error) {
      console.error("Impossible d'ajouter le département :", error);
    }
  }

  async function updateDepartment(id, patch) {
    setDepartments((prev) =>
      prev.map((dept) => (dept.id === id ? { ...dept, ...patch } : dept))
    );

    if (!companyId) return;

    try {
      await editDepartment(companyId, id, patch);
    } catch (error) {
      console.error("Impossible de modifier le département :", error);
    }
  }

  async function removeDepartment(id) {
    setDepartments((prev) => prev.filter((dept) => dept.id !== id));
    if (editingDeptId === id) setEditingDeptId(null);

    setTeamMembers((prev) =>
      prev.map((member) => ({
        ...member,
        departments: Array.isArray(member.departments)
          ? member.departments.filter((x) => x !== id)
          : [],
      }))
    );

    if (!companyId) return;

    try {
      await deleteDepartment(companyId, id);
    } catch (error) {
      console.error("Impossible de supprimer le département :", error);
    }
  }

  async function addMember() {
    if (!companyId) return;

    try {
      const id = await createMember(companyId);
      setEditingMemberId(id);
    } catch (error) {
      console.error("Impossible d'ajouter le membre :", error);
    }
  }

  async function updateMember(id, patch) {
    setTeamMembers((prev) =>
      prev.map((member) => (member.id === id ? { ...member, ...patch } : member))
    );

    if (!companyId) return;

    try {
      await editMember(companyId, id, patch);
    } catch (error) {
      console.error("Impossible de modifier le membre :", error);
    }
  }

  async function removeMember(id) {
    setTeamMembers((prev) => prev.filter((member) => member.id !== id));
    if (editingMemberId === id) setEditingMemberId(null);

    if (!companyId) return;

    try {
      await deleteMember(companyId, id);
    } catch (error) {
      console.error("Impossible de supprimer le membre :", error);
    }
  }

  return {
    officeLocations,
    departments,
    teamMembers,

    editingOfficeId,
    setEditingOfficeId,
    editingDeptId,
    setEditingDeptId,
    editingMemberId,
    setEditingMemberId,

    officeById,
    deptById,

    addOffice,
    updateOffice,
    removeOffice,
    addDepartment,
    updateDepartment,
    removeDepartment,
    addMember,
    updateMember,
    removeMember,
  };
}
