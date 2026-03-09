import Navbar from '../../components/Navbar.jsx'
import { useEffect, useMemo, useState } from "react";

import { TabButton } from './UITeam.jsx';
import OfficesView from "./OfficesView";
import DepartmentsView from "./DepartmentsView";
import MembersView from "./MembersView";

import {
  officeLocations as officeLocationsSeed,
  teamMembers as teamMembersSeed,
} from "./data_corp";
import {
  addCompanyDepartment,
  getUserCompanyId,
  onAuthStateChangedListener,
  removeCompanyDepartment,
  subscribeCompanyDepartments,
  updateCompanyDepartment,
} from "../../firebase/config";

export default function Team() {
  const [activeTab, setActiveTab] = useState("BUREAUX");

  const [officeLocations, setOfficeLocations] = useState(() => officeLocationsSeed || []);
  const [departments, setDepartments] = useState([]);
  const [teamMembers, setTeamMembers] = useState(() => teamMembersSeed || []);
  const [companyId, setCompanyId] = useState(null);

  // Row editing state (id en édition)
  const [editingOfficeId, setEditingOfficeId] = useState(null);
  const [editingDeptId, setEditingDeptId] = useState(null);
  const [editingMemberId, setEditingMemberId] = useState(null);

  const officeById = useMemo(() => {
    const m = new Map();
    (officeLocations || []).forEach((o) => m.set(o.id, o));
    return m;
  }, [officeLocations]);

  const deptById = useMemo(() => {
    const m = new Map();
    (departments || []).forEach((d) => m.set(d.id, d));
    return m;
  }, [departments]);

  useEffect(() => {
    const unsubscribe = onAuthStateChangedListener(async (currentUser) => {
      if (!currentUser) {
        setCompanyId(null);
        setDepartments([]);
        return;
      }

      try {
        const nextCompanyId = await getUserCompanyId(currentUser.uid);
        setCompanyId(nextCompanyId || null);
        if (!nextCompanyId) setDepartments([]);
      } catch (error) {
        console.error("Impossible de récupérer le companyId de l'utilisateur :", error);
        setCompanyId(null);
        setDepartments([]);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeCompanyDepartments(companyId, setDepartments);
    return () => unsubscribe();
  }, [companyId]);

  // ------- BUREAUX -------
  function addOffice() {
    const id = nextId(officeLocations);
    setOfficeLocations((prev) => [...prev, { id, name: "", address: "" }]);
    setEditingOfficeId(id);
  }

  function updateOffice(id, patch) {
    setOfficeLocations((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  }

  function removeOffice(id) {
    setOfficeLocations((prev) => prev.filter((o) => o.id !== id));
    if (editingOfficeId === id) setEditingOfficeId(null);

    // Optionnel: nettoyer les membres qui pointaient vers ce bureau
    setTeamMembers((prev) => prev.map((m) => (m.office === id ? { ...m, office: null } : m)));
  }

  // ------- EQUIPES (departments) -------
  async function addDepartment() {
    if (!companyId) return;

    try {
      const id = await addCompanyDepartment(companyId, { name: "" });
      setEditingDeptId(id);
    } catch (error) {
      console.error("Impossible d'ajouter le département :", error);
    }
  }

  async function updateDepartment(id, patch) {
    setDepartments((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));

    if (!companyId) return;

    try {
      await updateCompanyDepartment(companyId, id, patch);
    } catch (error) {
      console.error("Impossible de modifier le département :", error);
    }
  }

  async function removeDepartment(id) {
    setDepartments((prev) => prev.filter((d) => d.id !== id));
    if (editingDeptId === id) setEditingDeptId(null);

    // Optionnel: retirer ce dept de tous les membres
    setTeamMembers((prev) =>
      prev.map((m) => ({
        ...m,
        departments: Array.isArray(m.departments) ? m.departments.filter((x) => x !== id) : [],
      }))
    );

    if (!companyId) return;

    try {
      await removeCompanyDepartment(companyId, id);
    } catch (error) {
      console.error("Impossible de supprimer le département :", error);
    }
  }

  // ------- PERSONNELS (teamMembers) -------
  function addMember() {
    const id = nextId(teamMembers);
    setTeamMembers((prev) => [
      ...prev,
      {
        id,
        name: "",
        role: "",
        email: "",
        phone: "",
        departments: [],
        office: null, // id bureau
      },
    ]);
    setEditingMemberId(id);
  }

  function updateMember(id, patch) {
    setTeamMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }

  function removeMember(id) {
    setTeamMembers((prev) => prev.filter((m) => m.id !== id));
    if (editingMemberId === id) setEditingMemberId(null);
  }

  return (
    <>
    <Navbar />
    <div style={{ padding: 16, display: "grid", gap: 16 }}>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <TabButton active={activeTab === "BUREAUX"} onClick={() => setActiveTab("BUREAUX")}>
          Bureaux
        </TabButton>
        <TabButton active={activeTab === "EQUIPES"} onClick={() => setActiveTab("EQUIPES")}>
          Équipes
        </TabButton>
        <TabButton active={activeTab === "PERSONNELS"} onClick={() => setActiveTab("PERSONNELS")}>
          Personnels
        </TabButton>
      </div>

      {/* BUREAUX */}
      {activeTab === "BUREAUX" && (
        <OfficesView
          officeLocations={officeLocations}
          editingOfficeId={editingOfficeId}
          setEditingOfficeId={setEditingOfficeId}
          addOffice={addOffice}
          updateOffice={updateOffice}
          removeOffice={removeOffice}
        />
      )}

      {/* EQUIPES */}
      {activeTab === "EQUIPES" && (
        <DepartmentsView
          departments={departments}
          editingDeptId={editingDeptId}
          setEditingDeptId={setEditingDeptId}
          addDepartment={addDepartment}
          updateDepartment={updateDepartment}
          removeDepartment={removeDepartment}
        />
      )}

      {/* PERSONNELS */}
      {activeTab === "PERSONNELS" && (
        <MembersView
          teamMembers={teamMembers}
          editingMemberId={editingMemberId}
          setEditingMemberId={setEditingMemberId}
          addMember={addMember}
          updateMember={updateMember}
          removeMember={removeMember}
          officeLocations={officeLocations}
          departments={departments}
          officeById={officeById}
          deptById={deptById}
        />
      )}

    </div>
    </>
  );
}
