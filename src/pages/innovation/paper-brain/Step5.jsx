import { useMemo, useState, useEffect } from "react";
import { data } from "../../../components/StepTimeData";

function Step5() {
  const challenge =
    "Comment pourrions-nous inventer un produit antistress pour cadres en burn-out ?";

  const [participants] = useState([
    {
      id: 1,
      notes: [
        {
          note: "Une app de micro-pauses guidées de 3 minutes, intégrée au calendrier pro.",
          commentaires: [
            {
              id: crypto.randomUUID(),
              idUser: 2,
              text: "Ajouter des rappels pour encourager à prendre ces pauses régulièrement.",
            },
            {
              id: crypto.randomUUID(),
              idUser: 3,
              text: "Ajouter des exercices de respiration ou de méditation pour maximiser les bénéfices.",
            },
          ],
        },
        {
          note: "Un bracelet connecté qui mesure le stress et suggère des pauses personnalisées.",
          commentaires: [],
        },
        {
          note: "Un service de coaching court format (15 min/semaine) dédié aux cadres surchargés.",
          commentaires: [],
        },
      ],
    },
    {
      id: 2,
      notes: [
        {
          note: "Une cabine de sieste express au bureau.",
          commentaires: [
            {
              id: crypto.randomUUID(),
              idUser: 1,
              text: "Option musique relaxante / bruit blanc pour s'endormir vite ?",
            },
          ],
        },
        { note: "Un plugin Slack qui propose des breaks intelligents.", commentaires: [] },
        { note: "Des cartes 'reset mental' à tirer au hasard.", commentaires: [] },
      ],
    },
    {
      id: 3,
      notes: [
        { note: "Un mini-programme de respiration en réalité augmentée.", commentaires: [] },
        { note: "Un service d'accompagnement nutrition + sommeil.", commentaires: [] },
        { note: "Un tracker de surcharge cognitive (réunions, mails, etc.).", commentaires: [] },
      ],
    },
  ]);

  const allNotes = useMemo(() => {
    const out = [];
    for (const p of participants) {
      for (let i = 0; i < (p.notes?.length ?? 0); i++) {
        const n = p.notes[i];
        // id stable: participantId + index (simple et stable tant que l'ordre ne change pas)
        const id = `p${p.id}-n${i}`;
        out.push({
          id,
          participantId: p.id,
          note: n.note,
          commentaires: n.commentaires ?? [],
        });
      }
    }
    return out;
  }, [participants]);

  const [positions, setPositions] = useState({});

  useEffect(() => {
    setPositions((prev) => {
      const next = { ...prev };
      let k = 0;
      for (const n of allNotes) {
        if (!next[n.id]) {
          // placement initial en "grille" mais sur canvas
          const col = k % 5;
          const row = Math.floor(k / 5);
          next[n.id] = { x: 40 + col * 290, y: 40 + row * 220 };
          k++;
        }
      }
      return next;
    });

    // seed local: user 2 et 3 ont voté un peu
    setStickersByNote((prev) => {
      if (Object.keys(prev).length) return prev; // évite de reseed
      const next = {};
      // Exemple: 2 gommettes sur la 1ère note, 1 sur la 2ème, etc.
      if (allNotes[0]) next[allNotes[0].id] = new Set([2, 3]);
      if (allNotes[1]) next[allNotes[1].id] = new Set([2]);
      if (allNotes[3]) next[allNotes[3].id] = new Set([3]);
      return next;
    });

  }, [allNotes]);

  const CANVAS_W = 2800;
  const CANVAS_H = 1600;

  const [zoom, setZoom] = useState(100); // en %
  const scale = zoom / 100;

  const currentUserId = 1; // <- ton user courant (local)

  const MAX_STICKERS = 3;

  // Map noteId -> Set(userId)
  const [stickersByNote, setStickersByNote] = useState(() => ({}));

  // Combien de gommettes le user courant a posées (toutes notes confondues)
  const myStickerCount = useMemo(() => {
    let count = 0;
    for (const noteId of Object.keys(stickersByNote)) {
      if (stickersByNote[noteId]?.has(currentUserId)) count++;
    }
    return count;
  }, [stickersByNote, currentUserId]);

  const remainingStickers = MAX_STICKERS - myStickerCount;

  const toggleSticker = (noteId) => {
    setStickersByNote((prev) => {
      const next = { ...prev };
      const set = new Set(next[noteId] ?? []);

      // Retire si déjà présent
      if (set.has(currentUserId)) {
        set.delete(currentUserId);
        next[noteId] = set;
        return next;
      }

      // Sinon ajoute, si quota OK
      if (myStickerCount >= MAX_STICKERS) return prev;

      set.add(currentUserId);
      next[noteId] = set;
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-200 py-12 px-6">
      <div className="min-h-screen lg:mr-86">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">{data.title}</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          {data.steps[4]?.label ?? "Étape 5"}
        </h2>

        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          {(data.steps[4]?.description ?? [
            "Déplacez toutes les idées sur le canvas pour les regrouper par thèmes.",
            "Vous pouvez organiser librement l’espace.",
          ]).map((item, index) => (
            <p key={index} className="text-gray-600 mb-1 text-sm">
              {item}
            </p>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6 mb-4">
          <p className="text-gray-600 mb-1 text-sm">{challenge}</p>
        </div>

        {/* Canvas scrollable */}
        <div className="bg-white rounded-2xl shadow-md p-4">
          <div className="flex items-center justify-between mb-3">
            {/* Gommettes à distribuer */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Gommettes à distribuer :</span>

              <div className="flex items-center gap-1">
                {Array.from({ length: MAX_STICKERS }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-6 h-6 rounded-full ${
                      i < remainingStickers ? "bg-green-400" : "bg-green-200"
                    }`}
                    title={i < remainingStickers ? "Disponible" : "Déjà utilisée"}
                  />
                ))}
              </div>

              <span className="text-xs text-gray-500 ml-2">
                {remainingStickers}/{MAX_STICKERS} restantes
              </span>
            </div>
            
            {/* Zoom control */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-12 text-right">
                {zoom}%
              </span>

              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-40 accent-slate-600"
              />
            </div>
          </div>

          <div className="w-full overflow-auto rounded-xl border border-slate-200">
            {/* Zone réelle du canvas */}
            <div
                className="relative origin-top-left"
                style={{
                  width: CANVAS_W * scale,
                  height: CANVAS_H * scale,
                }}
            >
              {/* grille légère */}
              <div
                className="absolute inset-0 pointer-events-none opacity-30"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, rgba(15,23,42,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.08) 1px, transparent 1px)",
                  backgroundSize: `${60 * scale}px ${60 * scale}px`,
                }}
              />

              {/* Notes en position absolue */}
              {allNotes.map((n) => {
                const pos = positions[n.id] ?? { x: 40, y: 40 };

                const stickerSet = stickersByNote[n.id] ?? new Set();
                const hasMine = stickerSet.has(currentUserId);
                const otherCount = Math.max(0, stickerSet.size - (hasMine ? 1 : 0));

                return (
                  <div
                    key={n.id}
                    className="absolute select-none touch-none"
                    style={{
                      transform: `translate(${pos.x * scale}px, ${pos.y * scale}px) scale(${scale})`,
                      transformOrigin: "top left",
                      width: 260,
                    }}
                  >
                    <div
                      className="relative bg-yellow-100 rounded-lg shadow-md p-4"
                      role="button"
                      tabIndex={0}
                      data-x={pos.x}
                      data-y={pos.y}
                      title="Cliquer pour ajouter/retirer une gommette"
                      onClick={() => toggleSticker(n.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleSticker(n.id);
                        }
                      }}
                    >
                      {/* header */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-[11px] text-gray-500">
                          Participant {n.participantId}
                        </span>
                        {/* gommettes distribuées */}
                        <div className="flex items-center gap-1">
                          {/* gommette du user courant (vert) */}
                          <div
                            className={`w-3 h-3 rounded-full ${
                              hasMine ? "bg-green-500" : "bg-transparent border border-green-300"
                            }`}
                            title={hasMine ? "Ta gommette" : "Pas de gommette"}
                          />

                          {/* gommettes des autres (bleu) */}
                          {Array.from({ length: otherCount }).map((_, i) => (
                            <div
                              key={i}
                              className="w-3 h-3 rounded-full bg-blue-500"
                              title="Gommette d'un autre utilisateur"
                            />
                          ))}
                        </div>

                      </div>

                      {/* note text */}
                      <p className="text-gray-700 text-sm whitespace-pre-wrap">
                        {n.note || <span className="text-gray-400">—</span>}
                      </p>

                      {/* commentaires: lecture seule */}
                      {!!n.commentaires?.length && (
                        <div className="mt-3 space-y-2">
                          {n.commentaires.map((c) => (
                            <div
                              key={c.id}
                              className="bg-violet-50 border border-violet-100 rounded-lg p-2"
                            >
                              <p className="text-violet-700 text-xs whitespace-pre-wrap">
                                {c.text}
                              </p>
                              <p className="mt-1 text-[10px] text-violet-400">
                                User {c.idUser}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Step5;