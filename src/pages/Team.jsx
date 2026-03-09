import Navbar from "../components/Navbar.jsx";
import { useState } from "react";

import { TabButton } from "../components/team/UITeam.jsx";
import OfficesView from "../components/team/OfficesView.jsx";
import DepartmentsView from "../components/team/DepartmentsView.jsx";
import MembersView from "../components/team/MembersView.jsx";
import useCompanyTeam from "../hooks/useCompanyTeam.js";

export default function Team() {
  const [activeTab, setActiveTab] = useState("BUREAUX");

  const {
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
  } = useCompanyTeam();

  return (
    <>
      <Navbar />

      <div style={{ padding: 16, display: "grid", gap: 16 }}>
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