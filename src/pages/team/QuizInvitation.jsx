/**
 * @module pages/team/QuizInvitation
 * @description Quiz invitation page to set response delay and select invitees.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */
import Navbar from "../../components/Navbar.jsx";
import SectionNavButtons from "../../components/SectionNavButtons.jsx";
import {
  DepartmentSelectorCard,
  InviteSendResultModal,
  MemberSelectorCard,
  SendInvitesButton,
} from "../../components/workshop-invitation";
import { teamLinks } from "../../constants/navigationLinks.js";
import useQuizInvitation from "../../hooks/useQuizInvitation";

function resolveQuestionCount(quiz) {
  if (Array.isArray(quiz?.affirmations)) return quiz.affirmations.length;
  if (Array.isArray(quiz?.questions)) return quiz.questions.length;
  if (Array.isArray(quiz?.traits)) return quiz.traits.length;
  if (Array.isArray(quiz?.oppositions)) return quiz.oppositions.length;
  if (Array.isArray(quiz?.modèles)) return quiz.modèles.length;
  return 0;
}

function QuizHeroCard({ quiz }) {
  const questionCount = resolveQuestionCount(quiz);

  return (
    <div className="relative rounded-2xl shadow-sm border border-slate-200 mb-6 overflow-hidden">
      {quiz?.image && (
        <img
          src={quiz.image}
          alt={quiz?.title ?? "Quiz"}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/20 to-transparent" />

      <div className="relative z-10 p-6 space-y-4">
        <div>
          <p className="text-xs text-white/80">Quiz sélectionné</p>
          <h2 className="text-white text-2xl font-bold leading-tight">{quiz?.title ?? "Quiz"}</h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-white text-slate-700 px-3 py-1 text-sm">
            🧠 {questionCount > 0 ? `${questionCount} questions` : "Sans questions"}
          </span>
        </div>
      </div>
    </div>
  );
}

function QuizResponseDelayCard({ responseDelayDays, onChange }) {
  return (
    <div className="bg-white/80 backdrop-blur rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
      <label htmlFor="response-delay-days" className="block text-sm font-medium text-slate-700 mb-3">
        Nombre de jours pour répondre au quiz
      </label>

      <input
        id="response-delay-days"
        type="number"
        min="1"
        value={responseDelayDays}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
      />
    </div>
  );
}

function QuizInvitationSummaryCard({
  responseDelayDays,
  selectedDepartmentCount,
  selectedMemberCount,
  totalGuestCount,
  canSend,
}) {
  return (
    <div className="mt-6 bg-white/80 backdrop-blur rounded-2xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-3">Récapitulatif</h3>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Délai de réponse</p>
          <p className="text-sm font-semibold text-slate-900">{responseDelayDays} jour(s)</p>
        </div>

        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Équipes</p>
          <p className="text-sm font-semibold text-slate-900">{selectedDepartmentCount}</p>
        </div>

        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Invités en plus</p>
          <p className="text-sm font-semibold text-slate-900">{selectedMemberCount}</p>
        </div>

        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Total invités</p>
          <p className="text-sm font-semibold text-slate-900">{totalGuestCount}</p>
        </div>
      </div>

      {!canSend && (
        <p className="mt-4 text-sm text-slate-600">
          Pour envoyer, choisis un délai (minimum 1 jour) + au moins une équipe ou un invité.
        </p>
      )}
    </div>
  );
}

/**
 * Renders the QuizInvitation page.
 * @returns {JSX.Element} The rendered page layout.
 */
function QuizInvitation() {
  const {
    quiz,
    responseDelayDays,
    setResponseDelayDays,
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
  } = useQuizInvitation();

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-200 py-12 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-4xl font-bold text-gray-800">Invitation Quiz</h1>
            <SectionNavButtons
              links={teamLinks}
              ariaLabel="Navigation motivation"
              variant="page"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <QuizHeroCard quiz={quiz} />
            <QuizResponseDelayCard
              responseDelayDays={responseDelayDays}
              onChange={setResponseDelayDays}
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

          <QuizInvitationSummaryCard
            responseDelayDays={responseDelayDays}
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

export default QuizInvitation;
