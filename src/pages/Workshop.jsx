import { useMemo, useState } from "react";

import { officeLocations, departments, teamMembers } from "./team/data_corp.jsx";
import data from "./innovation/data_cards.jsx";

function Workshop() {
  const atelier = data?.[0] ?? { title: "Atelier" };

  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [workshopDate, setWorkshopDate] = useState(""); // format YYYY-MM-DD (input type="date")
  const [search, setSearch] = useState("");

  // Helpers robustes (au cas où tes objets ont des formes différentes)
  const getId = (obj, fallbackIndex) =>
    obj?.id ?? obj?._id ?? obj?.slug ?? obj?.code ?? String(fallbackIndex);

  const getDeptLabel = (d) =>
    d?.name ?? d?.label ?? d?.title ?? d?.department ?? "Département";

  const getMemberLabel = (m) => {
    const full =
      m?.fullName ??
      m?.name ??
      [m?.firstName, m?.lastName].filter(Boolean).join(" ") ??
      m?.title ??
      "Membre";
    const email = m?.email ?? m?.mail ?? "";
    return email ? `${full} — ${email}` : full;
  };

  const departmentsNormalized = useMemo(
    () => (departments ?? []).map((d, i) => ({ ...d, __id: getId(d, i), __label: getDeptLabel(d) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const membersNormalized = useMemo(
    () =>
      (teamMembers ?? []).map((m, i) => ({
        ...m,
        __id: getId(m, i),
        __label: getMemberLabel(m),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return membersNormalized;
    return membersNormalized.filter((m) => m.__label.toLowerCase().includes(q));
  }, [membersNormalized, search]);

  const toggleSelection = (id, selectedIds, setSelectedIds) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectedDepartments = useMemo(() => {
    const set = new Set(selectedDepartmentIds);
    return departmentsNormalized.filter((d) => set.has(d.__id));
  }, [departmentsNormalized, selectedDepartmentIds]);

  const selectedMembers = useMemo(() => {
    const set = new Set(selectedMemberIds);
    return membersNormalized.filter((m) => set.has(m.__id));
  }, [membersNormalized, selectedMemberIds]);

  const canSend =
    Boolean(workshopDate) &&
    (selectedDepartmentIds.length > 0 || selectedMemberIds.length > 0);

  const handleSendInvites = () => {
    // TODO: brancher ton backend / email service
    const payload = {
      atelierTitle: atelier?.title,
      date: workshopDate,
      departments: selectedDepartments.map((d) => ({ id: d.__id, label: d.__label })),
      guests: selectedMembers.map((m) => ({ id: m.__id, label: m.__label })),
      // Optionnel si tu veux inclure les sites:
      officeLocations: officeLocations ?? [],
    };

    console.log("Invitations payload:", payload);
    alert(
      `Invitations prêtes à être envoyées ✅\n\nAtelier: ${atelier?.title}\nDate: ${workshopDate}\nÉquipes: ${selectedDepartmentIds.length}\nInvités: ${selectedMemberIds.length}`
    );
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-200 py-12 px-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Atelier</h1>

        {/* Ligne: titre atelier à gauche + bouton à droite */}
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-500">Atelier sélectionné</p>
              <h2 className="text-2xl font-semibold text-slate-900">
                {atelier?.title ?? "Atelier"}
              </h2>
            </div>

            <button
              type="button"
              onClick={handleSendInvites}
              disabled={!canSend}
              className={[
                "inline-flex items-center justify-center rounded-xl px-5 py-3 font-semibold",
                "transition shadow-sm",
                canSend
                  ? "bg-slate-900 text-white hover:bg-slate-800"
                  : "bg-slate-200 text-slate-500 cursor-not-allowed",
              ].join(" ")}
            >
              Envoyer les invitations
            </button>
          </div>

          {/* Date */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Date de l’atelier
              </label>
              <input
                type="date"
                value={workshopDate}
                onChange={(e) => setWorkshopDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
              <p className="mt-2 text-xs text-slate-500">
                Choisis la date, puis sélectionne des équipes et/ou des invités.
              </p>
            </div>

            {/* (Option) lieux - juste affiché si tu veux t’en servir */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-700">Sites (optionnel)</p>
              <p className="text-xs text-slate-500 mt-1">
                {Array.isArray(officeLocations) && officeLocations.length > 0
                  ? `${officeLocations.length} site(s) disponible(s) — utilise-les si besoin pour filtrer ou informer.`
                  : "Aucun site détecté dans officeLocations."}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Départements */}
          <section className="bg-white/80 backdrop-blur rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Inviter des équipes
              </h3>
              <span className="text-xs rounded-full bg-slate-100 px-2 py-1 text-slate-700">
                {selectedDepartmentIds.length} sélectionnée(s)
              </span>
            </div>

            {departmentsNormalized.length === 0 ? (
              <p className="text-sm text-slate-600">
                Aucun département disponible (departments est vide).
              </p>
            ) : (
              <div className="space-y-2 max-h-[360px] overflow-auto pr-1">
                {departmentsNormalized.map((d) => {
                  const checked = selectedDepartmentIds.includes(d.__id);
                  return (
                    <label
                      key={d.__id}
                      className={[
                        "flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer",
                        checked
                          ? "border-slate-900 bg-slate-50"
                          : "border-slate-200 bg-white hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          toggleSelection(
                            d.__id,
                            selectedDepartmentIds,
                            setSelectedDepartmentIds
                          )
                        }
                        className="h-4 w-4"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {d.__label}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </section>

          {/* Invités */}
          <section className="bg-white/80 backdrop-blur rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Ajouter des invités
              </h3>
              <span className="text-xs rounded-full bg-slate-100 px-2 py-1 text-slate-700">
                {selectedMemberIds.length} sélectionné(s)
              </span>
            </div>

            <div className="mb-4">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un membre (nom/email)…"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>

            {membersNormalized.length === 0 ? (
              <p className="text-sm text-slate-600">
                Aucun membre disponible (teamMembers est vide).
              </p>
            ) : (
              <div className="space-y-2 max-h-[360px] overflow-auto pr-1">
                {filteredMembers.map((m) => {
                  const checked = selectedMemberIds.includes(m.__id);
                  return (
                    <label
                      key={m.__id}
                      className={[
                        "flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer",
                        checked
                          ? "border-slate-900 bg-slate-50"
                          : "border-slate-200 bg-white hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          toggleSelection(
                            m.__id,
                            selectedMemberIds,
                            setSelectedMemberIds
                          )
                        }
                        className="h-4 w-4"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {m.__label}
                        </p>
                      </div>
                    </label>
                  );
                })}

                {filteredMembers.length === 0 && (
                  <p className="text-sm text-slate-600">
                    Aucun résultat pour “{search}”.
                  </p>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Récap */}
        <div className="mt-6 bg-white/80 backdrop-blur rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-3">Récapitulatif</h3>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
              <p className="text-xs text-slate-500">Date</p>
              <p className="text-sm font-semibold text-slate-900">
                {workshopDate || "—"}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
              <p className="text-xs text-slate-500">Équipes</p>
              <p className="text-sm font-semibold text-slate-900">
                {selectedDepartmentIds.length}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
              <p className="text-xs text-slate-500">Invités</p>
              <p className="text-sm font-semibold text-slate-900">
                {selectedMemberIds.length}
              </p>
            </div>
          </div>

          {!canSend && (
            <p className="mt-4 text-sm text-slate-600">
              Pour envoyer, choisis une date + au moins une équipe ou un invité.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Workshop;