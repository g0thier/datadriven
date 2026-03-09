import Navbar from '../components/Navbar.jsx'
import { useEffect, useMemo, useState } from "react";

import { TabButton } from '../components/team/UITeam.jsx';
import OfficesView from "../components/team/OfficesView";
import DepartmentsView from "../components/team/DepartmentsView";
import MembersView from "../components/team/MembersView";

import {
  addCompanyOffice,
  addCompanyDepartment,
  addCompanyMember,
  getUserCompanyId,
  onAuthStateChangedListener,
  removeCompanyMember,
  removeCompanyOffice,
  removeCompanyDepartment,
  subscribeCompanyDepartments,
  subscribeCompanyMembers,
  subscribeCompanyOffices,
  updateCompanyMember,
  updateCompanyDepartment,
  updateCompanyOffice,
} from "../firebase";

export default function Team() {
  const [activeTab, setActiveTab] = useState("BUREAUX");

  const [officeLocations, setOfficeLocations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
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
    const unsubscribe = subscribeCompanyDepartments(companyId, setDepartments);
    return () => unsubscribe();
  }, [companyId]);

  useEffect(() => {
    const unsubscribe = subscribeCompanyOffices(companyId, setOfficeLocations);
    return () => unsubscribe();
  }, [companyId]);

  useEffect(() => {
    const unsubscribe = subscribeCompanyMembers(companyId, setTeamMembers);
    return () => unsubscribe();
  }, [companyId]);

  // ------- BUREAUX -------
  async function addOffice() {
    if (!companyId) return;

    try {
      const id = await addCompanyOffice(companyId, { name: "", address: "" });
      setEditingOfficeId(id);
    } catch (error) {
      console.error("Impossible d'ajouter le bureau :", error);
    }
  }

  async function updateOffice(id, patch) {
    setOfficeLocations((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));

    if (!companyId) return;

    try {
      await updateCompanyOffice(companyId, id, patch);
    } catch (error) {
      console.error("Impossible de modifier le bureau :", error);
    }
  }

  async function removeOffice(id) {
    setOfficeLocations((prev) => prev.filter((o) => o.id !== id));
    if (editingOfficeId === id) setEditingOfficeId(null);

    // Optionnel: nettoyer les membres qui pointaient vers ce bureau
    setTeamMembers((prev) =>
      prev.map((m) => (String(m.office) === String(id) ? { ...m, office: null } : m))
    );

    if (!companyId) return;

    try {
      await removeCompanyOffice(companyId, id);
    } catch (error) {
      console.error("Impossible de supprimer le bureau :", error);
    }
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
  async function addMember() {
    if (!companyId) return;

    try {
      const id = await addCompanyMember(companyId, {
        name: "",
        role: "",
        email: "",
        phone: "",
        departments: [],
        office: null,
      });
      setEditingMemberId(id);
    } catch (error) {
      console.error("Impossible d'ajouter le membre :", error);
    }
  }

  async function updateMember(id, patch) {
    setTeamMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));

    if (!companyId) return;

    try {
      await updateCompanyMember(companyId, id, patch);
    } catch (error) {
      console.error("Impossible de modifier le membre :", error);
    }
  }

  async function removeMember(id) {
    setTeamMembers((prev) => prev.filter((m) => m.id !== id));
    if (editingMemberId === id) setEditingMemberId(null);

    if (!companyId) return;

    try {
      await removeCompanyMember(companyId, id);
    } catch (error) {
      console.error("Impossible de supprimer le membre :", error);
    }
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
