import {
  DepartmentSelectorCard,
  InvitationSummaryCard,
  MemberSelectorCard,
  SendInvitesButton,
  WorkshopDateTimeCard,
  WorkshopHeroCard,
} from "../../components/workshop-invitation";
import useWorkshopInvitation from "../../hooks/useWorkshopInvitation";

function WorkshopInvitation() {
  const {
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
  } = useWorkshopInvitation();

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-200 py-12 px-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Atelier</h1>

        <div className="grid gap-6 lg:grid-cols-2">
          <WorkshopHeroCard atelier={atelier} />

          <WorkshopDateTimeCard
            date={workshopDate}
            time={workshopTime}
            onDateChange={setWorkshopDate}
            onTimeChange={setWorkshopTime}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <DepartmentSelectorCard
            items={departmentsNormalized}
            selectedIds={selectedDepartmentIds}
            onToggle={toggleDepartment}
          />

          <MemberSelectorCard
            items={membersNormalized}
            filteredItems={filteredMembers}
            search={search}
            onSearchChange={setSearch}
            selectedIds={selectedMemberIds}
            onToggle={toggleMember}
          />
        </div>

        <InvitationSummaryCard
          workshopDate={workshopDate}
          workshopTime={workshopTime}
          selectedDepartmentCount={selectedDepartmentIds.length}
          selectedMemberCount={selectedMemberIds.length}
          canSend={canSend}
        />

        <div className="mt-6 flex justify-end">
          <SendInvitesButton canSend={canSend} onClick={handleSendInvites} />
        </div>
      </div>
    </div>
  );
}

export default WorkshopInvitation;
