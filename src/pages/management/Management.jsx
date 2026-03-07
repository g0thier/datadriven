import React, { useMemo, useState } from "react";
import Navbar from "../../components/Navbar.jsx";
import { teamMembers as teamMembersSeed } from "../team/data_corp.jsx";

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

function isManager(member) {
  const role = String(member?.role ?? member?.jobTitle ?? "").toLowerCase();
  return role.includes("manager");
}

function getMemberId(member, index) {
  return member?.id ?? member?._id ?? member?.email ?? `manager-${index}`;
}

function getMemberLabel(member) {
  const name =
    member?.name ??
    member?.fullName ??
    [member?.firstName, member?.lastName].filter(Boolean).join(" ") ??
    "Manager";

  const role = member?.role ?? member?.jobTitle ?? "Manager";
  const email = member?.email ?? member?.mail ?? "";

  return {
    title: name,
    subtitle: email ? `${role} • ${email}` : role,
  };
}

function buildManagers(list) {
  const source = Array.isArray(list) ? list : [];
  const managers = source.filter(isManager).map((member, index) => {
    const id = getMemberId(member, index);
    const label = getMemberLabel(member);
    return {
      ...member,
      permissionId: String(id),
      label,
    };
  });

  if (managers.length > 0) return managers;

  return [
    {
      permissionId: "demo-manager-1",
      name: "Sophie Martin",
      role: "Innovation Manager",
      email: "sophie.martin@demo.com",
      label: {
        title: "Sophie Martin",
        subtitle: "Innovation Manager • sophie.martin@demo.com",
      },
    },
    {
      permissionId: "demo-manager-2",
      name: "Lucas Bernard",
      role: "Team Manager",
      email: "lucas.bernard@demo.com",
      label: {
        title: "Lucas Bernard",
        subtitle: "Team Manager • lucas.bernard@demo.com",
      },
    },
  ];
}

function cloneDefaultPermissions() {
  return JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS));
}

function normalizePermissions(permissionMap, managers) {
  const next = { ...(permissionMap ?? {}) };
  managers.forEach((manager) => {
    if (!next[manager.permissionId]) {
      next[manager.permissionId] = cloneDefaultPermissions();
    }
  });
  return next;
}

function Card({ children, className = "" }) {
  return (
    <div
      className={[
        "rounded-3xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
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
  const managers = useMemo(() => buildManagers(teamMembersSeed), []);

  const [selectedManagerId, setSelectedManagerId] = useState(managers[0]?.permissionId ?? "");
  const [permissionsByManager, setPermissionsByManager] = useState(() =>
    normalizePermissions({}, managers)
  );

  const permissions =
    permissionsByManager[selectedManagerId] ?? cloneDefaultPermissions();

  const selectedManager = managers.find((manager) => manager.permissionId === selectedManagerId);

  const selectedTeamSectionsCount = Object.values(permissions.teamSections).filter(Boolean).length;

  function updateManagerPermissions(updater) {
    setPermissionsByManager((prev) => {
      const current = prev[selectedManagerId] ?? cloneDefaultPermissions();
      const updated = updater(current);
      return {
        ...prev,
        [selectedManagerId]: updated,
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

      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-200 px-6 py-10">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
          <Card className="p-5 h-fit">
            <div className="mb-4">
              <p className="text-sm font-medium text-slate-500">Management</p>
              <h1 className="text-2xl font-bold text-slate-900">Droits d'accès managers</h1>
              <p className="mt-2 text-sm text-slate-600">
                Sélectionne un utilisateur avec un compte manager puis active les pages et sections autorisées.
              </p>
            </div>

            <div className="space-y-3">
              {managers.map((manager) => {
                const isActive = manager.permissionId === selectedManagerId;
                const managerPermissions = permissionsByManager[manager.permissionId] ?? cloneDefaultPermissions();
                const enabledPages = [
                  managerPermissions.innovationBundle ? 2 : 0,
                  managerPermissions.teamPage ? 1 : 0,
                ].reduce((sum, value) => sum + value, 0);

                return (
                  <button
                    key={manager.permissionId}
                    type="button"
                    onClick={() => setSelectedManagerId(manager.permissionId)}
                    className={[
                      "w-full rounded-2xl border p-4 text-left transition",
                      isActive
                        ? "border-slate-900 bg-slate-900 text-white shadow-lg"
                        : "border-slate-200 bg-white hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <p className="font-semibold">{manager.label.title}</p>
                    <p className={[
                      "mt-1 text-sm",
                      isActive ? "text-slate-200" : "text-slate-600",
                    ].join(" ")}>
                      {manager.label.subtitle}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className={[
                        "rounded-full px-2 py-1",
                        isActive ? "bg-white/15 text-white" : "bg-slate-100 text-slate-700",
                      ].join(" ")}>
                        {enabledPages} page(s) active(s)
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          <div className="grid gap-6">
            <Card className="p-6">
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
            </Card>

            <Card className="p-6">
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
                  label="Innovation + WorkshopInvitation"
                  description="Active ou désactive en même temps /innovation et /innovation/invitation."
                />

                <PermissionCheckbox
                  checked={permissions.teamPage}
                  onChange={toggleTeamPage}
                  label="Team"
                  description="Active ou désactive la page /team. Si tu désactives Team, toutes les sous-sections sont retirées."
                />
              </div>
            </Card>

            <Card className="p-6">
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
                    disabled={!permissions.teamPage}
                    label={section.label}
                    description={`Autorise l'onglet ${section.label} dans Team.`}
                  />
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-slate-900">Payload de sortie</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Exemple de structure prête à envoyer à ton backend ou à stocker dans Firestore / API.
                </p>
              </div>

              <pre className="overflow-auto rounded-2xl bg-slate-950 p-4 text-sm text-slate-100">
{JSON.stringify(payloadPreview, null, 2)}
              </pre>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
