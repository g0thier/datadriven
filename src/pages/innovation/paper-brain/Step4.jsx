import { useMemo, useRef, useState, useEffect } from "react";
import { data } from "../../../components/StepTimeData";

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/**
 * Petit hook pour gérer le drag en pointer events (sans libs).
 * - drag uniquement dans le canvas
 * - positions en state via setPositions
 */
function useDragNotes({ canvasRef, setPositions }) {
  const dragRef = useRef({
    draggingId: null,
    pointerId: null,
    startPointerX: 0,
    startPointerY: 0,
    startX: 0,
    startY: 0,
    canvasRect: null,
    noteRect: null,
  });

  const onPointerDown = (e, noteId) => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    const noteEl = e.currentTarget;

    // Capture pointer (important pour garder le drag même si on sort du post-it)
    noteEl.setPointerCapture?.(e.pointerId);

    const canvasRect = canvasEl.getBoundingClientRect();
    const noteRect = noteEl.getBoundingClientRect();

    dragRef.current = {
      draggingId: noteId,
      pointerId: e.pointerId,
      startPointerX: e.clientX,
      startPointerY: e.clientY,
      startX: parseFloat(noteEl.dataset.x || "0"),
      startY: parseFloat(noteEl.dataset.y || "0"),
      canvasRect,
      noteRect,
    };
  };

  const onPointerMove = (e) => {
    const st = dragRef.current;
    if (!st.draggingId || st.pointerId !== e.pointerId) return;

    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    // delta pointer
    const dx = e.clientX - st.startPointerX;
    const dy = e.clientY - st.startPointerY;

    // tentative new pos
    let nextX = st.startX + dx;
    let nextY = st.startY + dy;

    // limites dans le canvas
    // on calcule les dimensions "logiques" du canvas via scrollWidth/scrollHeight
    const canvasW = canvasEl.scrollWidth;
    const canvasH = canvasEl.scrollHeight;

    // taille du post-it (px)
    const noteW = st.noteRect?.width ?? 260;
    const noteH = st.noteRect?.height ?? 180;

    nextX = clamp(nextX, 0, canvasW - noteW);
    nextY = clamp(nextY, 0, canvasH - noteH);

    // update position
    setPositions((prev) => ({
      ...prev,
      [st.draggingId]: { x: nextX, y: nextY },
    }));
  };

  const onPointerUp = (e) => {
    const st = dragRef.current;
    if (!st.draggingId || st.pointerId !== e.pointerId) return;

    dragRef.current = {
      draggingId: null,
      pointerId: null,
      startPointerX: 0,
      startPointerY: 0,
      startX: 0,
      startY: 0,
      canvasRect: null,
      noteRect: null,
    };
  };

  return { onPointerDown, onPointerMove, onPointerUp };
}

function Step4() {
  const challenge =
    "Comment pourrions-nous inventer un produit antistress pour cadres en burn-out ?";

  // --- Tu peux récupérer EXACTEMENT le même state que Step3 ---
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

  // 1) On aplatit toutes les notes en une seule liste
  //    Chaque note doit avoir un id stable pour stocker sa position.
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

  // 2) Positions des post-it (x,y)
  //    On init les notes automatiquement si pas de position.
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
  }, [allNotes]);

  // 3) Canvas
  const canvasRef = useRef(null);
  const { onPointerDown, onPointerMove, onPointerUp } = useDragNotes({
    canvasRef,
    setPositions,
  });

  // Taille "espace" : tu peux augmenter sans problème
  const CANVAS_W = 2800;
  const CANVAS_H = 1600;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-200 py-12 px-6">
      <div className="min-h-screen lg:mr-86">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">{data.title}</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          {data.steps[3]?.label ?? "Étape 4"}
        </h2>

        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          {(data.steps[3]?.description ?? [
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
            <p className="text-sm text-gray-600">
              {allNotes.length} notes • Glissez-déposez pour organiser
            </p>

            <button
              className="text-sm px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition"
              onClick={() => {
                // reset positions (optionnel)
                setPositions({});
              }}
            >
              Réinitialiser la disposition
            </button>
          </div>

          <div className="w-full overflow-auto rounded-xl border border-slate-200">
            {/* Zone réelle du canvas */}
            <div
              ref={canvasRef}
              className="relative"
              style={{ width: CANVAS_W, height: CANVAS_H }}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onPointerLeave={onPointerUp}
            >
              {/* (optionnel) grille légère */}
              <div
                className="absolute inset-0 pointer-events-none opacity-30"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, rgba(15,23,42,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.08) 1px, transparent 1px)",
                  backgroundSize: "60px 60px",
                }}
              />

              {/* Notes en position absolue */}
              {allNotes.map((n) => {
                const pos = positions[n.id] ?? { x: 40, y: 40 };
                return (
                  <div
                    key={n.id}
                    className="absolute select-none touch-none"
                    style={{
                      transform: `translate(${pos.x}px, ${pos.y}px)`,
                      width: 260,
                    }}
                  >
                    <div
                      className="relative bg-yellow-100 rounded-lg shadow-md p-4"
                      role="button"
                      tabIndex={0}
                      onPointerDown={(e) => onPointerDown(e, n.id)}
                      data-x={pos.x}
                      data-y={pos.y}
                      title="Glisser pour déplacer"
                    >
                      {/* header */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-[11px] text-gray-500">
                          Participant {n.participantId}
                        </span>
                        <span className="text-[11px] text-gray-400">⇕</span>
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

          <p className="mt-3 text-xs text-gray-500">
            Astuce : augmente CANVAS_W / CANVAS_H pour un espace plus grand.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Step4;