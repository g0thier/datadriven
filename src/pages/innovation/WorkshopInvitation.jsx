/**
 * @module pages/innovation/WorkshopInvitation
 * @description Workshop invitation page to schedule sessions and select invitees.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */
import Navbar from "../../components/Navbar.jsx";
import SectionNavButtons from "../../components/SectionNavButtons.jsx";
import {
  DepartmentSelectorCard,
  InvitationSummaryCard,
  InviteSendResultModal,
  MemberSelectorCard,
  SendInvitesButton,
  WorkshopDateTimeCard,
  WorkshopHeroCard,
} from "../../components/workshop-invitation";
import { innovationLinks } from "../../constants/navigationLinks.js";
import useWorkshopInvitation from "../../hooks/useWorkshopInvitation";

/**
 * Renders the WorkshopInvitation page.
 * @returns {JSX.Element} The rendered page layout.
 *
 * @example
 * import { lazy } from "react";
 * const WorkshopInvitation = lazy(() => import("./pages/innovation/WorkshopInvitation.jsx"));
 *
 * // Real usage reference: src/App.jsx
 * <Route path="/innovation/invitation" element={<WorkshopInvitation />} />;
 */
function WorkshopInvitation() {
  const {
    atelier,
    workshopDate,
    workshopTime,
    workshopTimezone,
    setWorkshopDate,
    setWorkshopTime,
    setWorkshopTimezone,
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
    inviteResultModal,
    closeInviteResultModal,
    handleSendInvites,
  } = useWorkshopInvitation();

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-200 py-12 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-4xl font-bold text-gray-800">Atelier</h1>
            <SectionNavButtons
              links={innovationLinks}
              ariaLabel="Navigation innovation"
              variant="page"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <WorkshopHeroCard atelier={atelier} />

            <WorkshopDateTimeCard
              date={workshopDate}
              time={workshopTime}
              timezone={workshopTimezone}
              onDateChange={setWorkshopDate}
              onTimeChange={setWorkshopTime}
              onTimezoneChange={setWorkshopTimezone}
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

        <InviteSendResultModal
          isOpen={inviteResultModal.isOpen}
          variant={inviteResultModal.variant}
          title={inviteResultModal.title}
          lines={inviteResultModal.lines}
          onConfirm={closeInviteResultModal}
        />
      </div>
    </>
  );
}

export default WorkshopInvitation;
