import Navbar from "../../components/Navbar.jsx";
import SectionNavButtons from "../../components/SectionNavButtons.jsx";
import ManagerSummary from "../../components/management/ManagerSummary.jsx";
import ManagersAccess from "../../components/management/ManagersAccess.jsx";
import CollaboratorSearchPanel from "../../components/management/CollaboratorSearchPanel.jsx";
import PagesSelection from "../../components/management/PagesSelection.jsx";
import { managementLinks } from "../../constants/navigationLinks.js";
import useCompanyManagers from "../../hooks/management/useCompanyManagers.js";
import useCompanyCollaborators from "../../hooks/management/useCompanyCollaborators.js";
import useManagementPageTree from "../../hooks/management/useManagementPageTree.js";
import useManagerPermissions from "../../hooks/management/useManagerPermissions.js";

export default function Management() {
  const { managers, demoteManager, demotingManagerId, demotionError } = useCompanyManagers();
  const {
    collaborators,
    promoteCollaborator,
    promotingCollaboratorId,
    promotionError,
  } = useCompanyCollaborators();
  const { pageTree, pageLeafPaths, getPathDisplayMeta } = useManagementPageTree();

  const {
    selectedManagerId,
    onSelectManager,
    permissionsByManager,
    pageAccess,
    selectedManager,
    isOwnerProfile,
    isPagesSelectionDisabled,
    toggleLevel1Group,
    togglePagePath,
    totalDepartmentsCount,
    totalLevel2PagesCount,
    selectedDepartmentsCount,
    selectedLevel2PagesCount,
  } = useManagerPermissions({
    managers,
    pageTree,
    pageLeafPaths,
  });

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-200 px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-4xl font-bold text-gray-800">Management</h1>
            <SectionNavButtons
              links={managementLinks}
              ariaLabel="Navigation management"
              variant="page"
            />
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
            <div className="grid gap-6">
              <ManagersAccess
                managers={managers}
                selectedManagerId={selectedManagerId}
                permissionsByManager={permissionsByManager}
                onSelectManager={onSelectManager}
                onDemoteManager={demoteManager}
                demotingManagerId={demotingManagerId}
                demotionError={demotionError}
              />

              <CollaboratorSearchPanel
                collaborators={collaborators}
                onPromoteCollaborator={promoteCollaborator}
                promotingCollaboratorId={promotingCollaboratorId}
                promotionError={promotionError}
              />
            </div>

            <div className="grid gap-6">
              <ManagerSummary
                selectedManager={selectedManager}
                selectedDepartmentsCount={selectedDepartmentsCount}
                totalDepartmentsCount={totalDepartmentsCount}
                selectedLevel2PagesCount={selectedLevel2PagesCount}
                totalLevel2PagesCount={totalLevel2PagesCount}
              />

              <PagesSelection
                pageTree={pageTree}
                pageAccess={pageAccess}
                isDisabled={isPagesSelectionDisabled}
                isOwnerProfile={isOwnerProfile}
                onToggleLevel1={toggleLevel1Group}
                onToggleLevel2={togglePagePath}
                getPathDisplayMeta={getPathDisplayMeta}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
