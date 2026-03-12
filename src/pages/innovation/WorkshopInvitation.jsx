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
            filteredItems={filteredDepartments}
            search={departmentSearch}
            onSearchChange={setDepartmentSearch}
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
          totalGuestCount={totalUniqueGuestCount}
          canSend={canSend}
        />

        <div className="mt-6 flex justify-end">
          <SendInvitesButton
            canSend={canSend}
            onClick={handleSendInvites}
            isSending={isSending}
          />
        </div>
      </div>
    </div>
  );
}

export default WorkshopInvitation;
