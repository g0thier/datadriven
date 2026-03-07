import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

import { officeLocations, departments, teamMembers } from "../team/data_corp.jsx";

function WorkshopInvitation() {
  const location = useLocation();
  const atelier = location.state?.workshop ?? { title: "Atelier" };

  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [workshopDate, setWorkshopDate] = useState("");
  const [workshopTime, setWorkshopTime] = useState("");
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
    Boolean(workshopTime) &&
    (selectedDepartmentIds.length > 0 || selectedMemberIds.length > 0);

  const handleSendInvites = () => {

    const workshopDateTime =
    workshopDate && workshopTime
      ? `${workshopDate}T${workshopTime}`
      : "";
    // TODO: brancher ton backend / email service
    const payload = {
      atelierTitle: atelier?.title,
      date: workshopDate,
      time: workshopTime,
      datetime: workshopDateTime,
      departments: selectedDepartments.map((d) => ({ id: d.__id, label: d.__label })),
      guests: selectedMembers.map((m) => ({ id: m.__id, label: m.__label })),
      // Optionnel si tu veux inclure les sites:
      officeLocations: officeLocations ?? [],
    };

    console.log("Invitations payload:", payload);
    alert(
      `Invitations prêtes à être envoyées ✅\n\nAtelier: ${atelier?.title}\nDate: ${workshopDateTime}\nÉquipes: ${selectedDepartmentIds.length}\nInvités: ${selectedMemberIds.length}`
    );
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-200 py-12 px-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Atelier</h1>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Présentation de l'atelier */}
          <div className="relative rounded-2xl shadow-sm border border-slate-200 mb-6 overflow-hidden">

            {/* Image en fond */}
            {atelier?.image && (
              <img
                src={atelier.image}
                alt={atelier?.title ?? "Atelier"}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}

            {/* Léger dégradé */}
            <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/20 to-transparent" />


            {/* Contenu */}
            <div className="relative z-10 p-6 space-y-4">
              
              <div>
                <p className="text-xs text-white/80">Atelier sélectionné</p>
                <h2 className="text-white text-2xl font-bold leading-tight">
                  {atelier?.title ?? "Atelier"}
                </h2>
              </div>

              {/* Meta */}
              {(atelier?.duration || atelier?.groupSize) && (
                <div className="flex flex-wrap gap-2">
                  {atelier?.duration && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-white text-slate-700 px-3 py-1 text-sm">
                      ⏱ {atelier.duration}
                    </span>
                  )}
                  {atelier?.groupSize && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-white text-slate-700 px-3 py-1 text-sm">
                      👥 {atelier.groupSize}
                    </span>
                  )}
                </div>
              )}

            </div>
          </div>

          {/* Date */}
          <div className="bg-white/80 backdrop-blur rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Date et heure de l’atelier
            </label>

            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={workshopDate}
                onChange={(e) => setWorkshopDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />

              <input
                type="time"
                value={workshopTime}
                onChange={(e) => setWorkshopTime(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
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
              <div className="space-y-2 max-h-90 overflow-auto pr-1">
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
              <div className="space-y-2 max-h-90 overflow-auto pr-1">
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
              <p className="text-xs text-slate-500">Date et heure</p>
              <p className="text-sm font-semibold text-slate-900">
                {workshopDate && workshopTime ? `${workshopDate} ${workshopTime}` : "—"}
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

        {/* Bouton en bas */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleSendInvites}
            disabled={!canSend}
            className={[
              "inline-flex items-center justify-center rounded-xl px-6 py-3 font-semibold",
              "transition shadow-sm",
              canSend
                ? "bg-slate-900 text-white hover:bg-slate-800"
                : "bg-slate-200 text-slate-500 cursor-not-allowed",
            ].join(" ")}
          >
            Envoyer les invitations
          </button>
        </div>
      </div>
    </div>
  );
}

export default WorkshopInvitation;