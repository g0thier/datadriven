import { useMemo, useState } from "react";

export default function CollaboratorSearchPanel({
  collaborators,
  onPromoteCollaborator,
  promotingCollaboratorId,
  promotionError,
}) {
  const [search, setSearch] = useState("");
  const query = search.trim().toLowerCase();
  const hasCollaborators = (collaborators ?? []).length > 0;

  const filteredCollaborators = useMemo(() => {
    if (!query) return [];

    return (collaborators ?? []).filter((collaborator) =>
      String(collaborator?.searchLabel || "").toLowerCase().includes(query)
    );
  }, [collaborators, query]);

  return (
    <section className="h-fit rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur">
      <div className="mb-4">
        <p className="text-sm font-medium text-slate-500">Recherche de collaborateurs</p>
        <h2 className="text-2xl font-bold text-slate-900">Ajouter un leader</h2>
      </div>

      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Nom ou email d'un collaborateur"
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
      />

      <div className="mt-4">
        {promotionError ? <p className="mb-2 text-xs text-rose-600">{promotionError}</p> : null}

        {query && filteredCollaborators.length > 0 ? (
          <p className="mb-2 text-xs text-slate-500">
            {filteredCollaborators.length} résultat{filteredCollaborators.length > 1 ? "s" : ""}
          </p>
        ) : null}

        {!query ? (
          <p className="text-sm text-slate-600">
            Commencez à taper pour afficher une liste de collaborateurs.
          </p>
        ) : !hasCollaborators ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Aucun membre avec le rôle collaborateur n'a été trouvé.
          </p>
        ) : filteredCollaborators.length === 0 ? (
          <p className="text-sm text-slate-600">Aucun résultat pour "{search}".</p>
        ) : (
          <div className="max-h-80 space-y-2 overflow-auto pr-1">
            {filteredCollaborators.map((collaborator) => (
              <button
                key={collaborator.collaboratorId}
                type="button"
                onClick={() => onPromoteCollaborator?.(collaborator.collaboratorId)}
                disabled={promotingCollaboratorId === collaborator.collaboratorId}
                className={[
                  "w-full rounded-xl border px-4 py-3 text-left transition",
                  promotingCollaboratorId === collaborator.collaboratorId
                    ? "border-slate-300 bg-slate-100"
                    : "cursor-pointer border-slate-200 bg-white hover:bg-slate-50",
                ].join(" ")}
              >
                <p className="text-sm font-medium text-slate-900 truncate">
                  {collaborator.displayName}
                </p>
                {collaborator.email ? (
                  <p className="mt-1 text-xs text-slate-600 truncate">{collaborator.email}</p>
                ) : null}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
