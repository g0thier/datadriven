import { useEffect, useMemo, useState } from "react";
import Navbar from "../../components/Navbar.jsx";
import SectionNavButtons from "../../components/SectionNavButtons.jsx";
import ManagersAccessCard from "../../components/management/ManagersAccessCard.jsx";
import { managementLinks } from "../../constants/navigationLinks.js";
import { getUserCompanyId, onAuthStateChangedListener, subscribeCompanyManagers } from "../../firebase";
import { buildManagerList } from "../../utils/managers.utils.js";

const TEAM_SECTIONS = [
  { key: "offices", label: "Bureaux" },
  { key: "departments", label: "Équipes" },
  { key: "members", label: "Personnels" },
];

const DEFAULT_PERMISSIONS = {
  innovationBundle: false,
  teamPage: false,
  teamSections: {
    offices: false,
    departments: false,
    members: false,
  },
};

function cloneDefaultPermissions() {
  return JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS));
}

function normalizePermissions(permissionMap, managers) {
  const source = permissionMap ?? {};
  const next = {};

  managers.forEach((manager) => {
    next[manager.permissionId] = source[manager.permissionId] ?? cloneDefaultPermissions();
  });

  return next;
}

function PermissionCheckbox({ checked, onChange, label, description, disabled = false }) {
  return (
    <label
      className={[
        "flex items-start gap-3 rounded-2xl border px-4 py-4 transition",
        disabled
          ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
          : checked
          ? "cursor-pointer border-slate-900 bg-slate-50"
          : "cursor-pointer border-slate-200 bg-white hover:bg-slate-50",
      ].join(" ")}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="mt-1 h-4 w-4"
      />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
      </div>
    </label>
  );
}

export default function Management() {
  const [companyId, setCompanyId] = useState(null);
  const [managerRecords, setManagerRecords] = useState([]);
  const managers = useMemo(() => buildManagerList(managerRecords), [managerRecords]);

  const [selectedManagerId, setSelectedManagerId] = useState("");
  const [permissionsByManager, setPermissionsByManager] = useState({});

  useEffect(() => {
    const unsubscribe = onAuthStateChangedListener(async (currentUser) => {
      if (!currentUser) {
        setCompanyId(null);
        setManagerRecords([]);
        return;
      }

      try {
        const nextCompanyId = await getUserCompanyId(currentUser.uid);
        setCompanyId(nextCompanyId || null);

        if (!nextCompanyId) {
          setManagerRecords([]);
        }
      } catch (error) {
        console.error("Impossible de récupérer le companyId de l'utilisateur :", error);
        setCompanyId(null);
        setManagerRecords([]);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeCompanyManagers(companyId, setManagerRecords);
    return () => unsubscribe();
  }, [companyId]);

  const normalizedPermissionsByManager = useMemo(
    () => normalizePermissions(permissionsByManager, managers),
    [permissionsByManager, managers]
  );

  const effectiveSelectedManagerId = useMemo(() => {
    if (managers.length === 0) return "";

    const isCurrentManagerStillPresent = managers.some(
      (manager) => manager.permissionId === selectedManagerId
    );

    return isCurrentManagerStillPresent
      ? selectedManagerId
      : managers[0].permissionId;
  }, [managers, selectedManagerId]);

  const permissions =
    normalizedPermissionsByManager[effectiveSelectedManagerId] ?? cloneDefaultPermissions();

  const selectedManager = managers.find(
    (manager) => manager.permissionId === effectiveSelectedManagerId
  );

  const selectedTeamSectionsCount = Object.values(permissions.teamSections).filter(Boolean).length;

  function updateManagerPermissions(updater) {
    if (!effectiveSelectedManagerId) return;

    setPermissionsByManager((prev) => {
      const normalized = normalizePermissions(prev, managers);
      const current = normalized[effectiveSelectedManagerId] ?? cloneDefaultPermissions();
      const updated = updater(current);
      return {
        ...normalized,
        [effectiveSelectedManagerId]: updated,
      };
    });
  }

  function toggleInnovationBundle() {
    updateManagerPermissions((current) => ({
      ...current,
      innovationBundle: !current.innovationBundle,
    }));
  }

  function toggleTeamPage() {
    updateManagerPermissions((current) => {
      const nextValue = !current.teamPage;
      return {
        ...current,
        teamPage: nextValue,
        teamSections: nextValue
          ? current.teamSections
          : {
              offices: false,
              departments: false,
              members: false,
            },
      };
    });
  }

  function toggleTeamSection(sectionKey) {
    updateManagerPermissions((current) => {
      const nextSections = {
        ...current.teamSections,
        [sectionKey]: !current.teamSections[sectionKey],
      };

      const hasAtLeastOneSection = Object.values(nextSections).some(Boolean);

      return {
        ...current,
        teamPage: hasAtLeastOneSection ? true : current.teamPage,
        teamSections: nextSections,
      };
    });
  }

  const payloadPreview = useMemo(() => {
    if (!selectedManager) return null;

    return {
      managerId: selectedManager.permissionId,
      managerName: selectedManager.label.title,
      permissions: {
        pages: {
          innovation: permissions.innovationBundle,
          workshopInvitation: permissions.innovationBundle,
          team: permissions.teamPage,
        },
        sections: {
          team: permissions.teamSections,
        },
      },
    };
  }, [permissions, selectedManager]);

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

          <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
            <ManagersAccessCard
              managers={managers}
              selectedManagerId={effectiveSelectedManagerId}
              permissionsByManager={normalizedPermissionsByManager}
              onSelectManager={setSelectedManagerId}
            />

            <div className="grid gap-6">
              <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Manager sélectionné</p>
                    <h2 className="text-2xl font-bold text-slate-900">
                      {selectedManager?.label.title ?? "Aucun manager"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {selectedManager?.label.subtitle ?? "Aucune donnée disponible."}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 md:min-w-72">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs text-slate-500">Pages actives</p>
                      <p className="mt-1 text-2xl font-bold text-slate-900">
                        {(permissions.innovationBundle ? 2 : 0) + (permissions.teamPage ? 1 : 0)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs text-slate-500">Sections Team</p>
                      <p className="mt-1 text-2xl font-bold text-slate-900">
                        {selectedTeamSectionsCount}/3
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
                <div className="mb-5">
                  <h3 className="text-xl font-bold text-slate-900">Pages</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Une case peut piloter plusieurs routes ou une seule page selon ton besoin métier.
                  </p>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  <PermissionCheckbox
                    checked={permissions.innovationBundle}
                    onChange={toggleInnovationBundle}
                    disabled={!effectiveSelectedManagerId}
                    label="Innovation + WorkshopInvitation"
                    description="Active ou désactive en même temps /innovation et /innovation/invitation."
                  />

                  <PermissionCheckbox
                    checked={permissions.teamPage}
                    onChange={toggleTeamPage}
                    disabled={!effectiveSelectedManagerId}
                    label="Team"
                    description="Active ou désactive la page /team. Si tu désactives Team, toutes les sous-sections sont retirées."
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
                <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Sections de Team</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Gestion plus granulaire des 3 onglets présents dans la page Team.
                    </p>
                  </div>

                  <span className="inline-flex h-fit items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {permissions.teamPage ? "Page Team activée" : "Page Team désactivée"}
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {TEAM_SECTIONS.map((section) => (
                    <PermissionCheckbox
                      key={section.key}
                      checked={permissions.teamSections[section.key]}
                      onChange={() => toggleTeamSection(section.key)}
                      disabled={!effectiveSelectedManagerId || !permissions.teamPage}
                      label={section.label}
                      description={`Autorise l'onglet ${section.label} dans Team.`}
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-slate-900">Payload de sortie</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Exemple de structure prête à envoyer à ton backend ou à stocker dans Firestore / API.
                  </p>
                </div>

                <pre className="overflow-auto rounded-2xl bg-slate-950 p-4 text-sm text-slate-100">
{JSON.stringify(payloadPreview, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
