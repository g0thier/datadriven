import { useState } from "react";
import { data } from "../../../components/StepTimeData";

function Step3() {
  const challenge =
    "Comment pourrions-nous inventer un produit antistress pour cadres en burn-out ?";

  // Niveau : participants -> notes -> commentaires
  const [participants, setParticipants] = useState([
    {
      id: 1,
      nom: "Participant 1",
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
      nom: "Participant 2",
      notes: [
        { note: "Une cabine de sieste express au bureau.", 
          commentaires: [
            {
              id: crypto.randomUUID(),
              idUser: 1,
              text: "Peut-être ajouter une option de musique relaxante ou de bruit blanc pour aider à s'endormir plus rapidement ?",
            },
          ] },
        { note: "Un plugin Slack qui propose des breaks intelligents.", commentaires: [] },
        { note: "Des cartes 'reset mental' à tirer au hasard.", commentaires: [] },
      ],
    },
    {
      id: 3,
      nom: "Participant 3",
      notes: [
        { note: "Un mini-programme de respiration en réalité augmentée.", commentaires: [] },
        { note: "Un service d'accompagnement nutrition + sommeil.", commentaires: [] },
        { note: "Un tracker de surcharge cognitive (réunions, mails, etc.).", commentaires: [] },
      ],
    },
  ]);

  const [currentIdUser] = useState(1); // utilisateur connecté (celui qui écrit/modifie SES commentaires)
  const [currentParticipantIndex, setCurrentParticipantIndex] = useState(0); // ✅ navigation participants

  const currentParticipant = participants[currentParticipantIndex];
  const visibleNotes = currentParticipant?.notes ?? [];

  // ✅ navigation participant par participant
  const goToPreviousParticipant = () => {
    setCurrentParticipantIndex((prev) =>
      prev === 0 ? participants.length - 1 : prev - 1
    );
  };

  const goToNextParticipant = () => {
    setCurrentParticipantIndex((prev) =>
      prev === participants.length - 1 ? 0 : prev + 1
    );
  };

  // --- COMMENTAIRES (noteIndex sur les notes du participant courant) ---
  const addComment = (noteIndex) => {
    setParticipants((prev) =>
      prev.map((p, pIndex) => {
        if (pIndex !== currentParticipantIndex) return p;

        const nextNotes = p.notes.map((n, i) => {
          if (i !== noteIndex) return n;

          return {
            ...n,
            commentaires: [
              ...(n.commentaires ?? []),
              {
                id: crypto.randomUUID(),
                idUser: currentIdUser,
                text: "",
              },
            ],
          };
        });

        return { ...p, notes: nextNotes };
      })
    );
  };

  const updateComment = (noteIndex, commentId, value) => {
    setParticipants((prev) =>
      prev.map((p, pIndex) => {
        if (pIndex !== currentParticipantIndex) return p;

        const nextNotes = p.notes.map((n, i) => {
          if (i !== noteIndex) return n;

          return {
            ...n,
            commentaires: (n.commentaires ?? []).map((c) =>
              c.id === commentId ? { ...c, text: value } : c
            ),
          };
        });

        return { ...p, notes: nextNotes };
      })
    );
  };

  const removeComment = (noteIndex, commentId) => {
    setParticipants((prev) =>
      prev.map((p, pIndex) => {
        if (pIndex !== currentParticipantIndex) return p;

        const nextNotes = p.notes.map((n, i) => {
          if (i !== noteIndex) return n;

          return {
            ...n,
            commentaires: (n.commentaires ?? []).filter((c) => c.id !== commentId),
          };
        });

        return { ...p, notes: nextNotes };
      })
    );
  };

  const isOwnNotes = currentParticipant?.id === currentIdUser;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-200 py-12 px-6">
      <div className="min-h-screen lg:mr-86">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">{data.title}</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          {data.steps[2].label}
        </h2>

        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          {data.steps[2].description.map((item, index) => (
            <p key={index} className="text-gray-600 mb-1 text-sm">
              {item}
            </p>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6 mb-4">
          <p className="text-gray-600 mb-1 text-sm">{challenge}</p>
        </div>

        {/* ✅ navigation entre participants */}
        <div className="flex justify-between items-center col-span-full mb-3 px-2">
          <button
            className="rounded-full bg-violet-500 text-white w-8 h-8 flex items-center justify-center shadow-md hover:bg-violet-600 transition"
            onClick={goToPreviousParticipant}
          >
            <span className="relative -top-px">&lt;</span>
          </button>

          <p className="text-gray-600 text-sm">
            Notes de {currentParticipant?.nom ?? "—"} ({currentParticipantIndex + 1}/{participants.length})
          </p>

          <button
            className="rounded-full bg-violet-500 text-white w-8 h-8 flex items-center justify-center shadow-md hover:bg-violet-600 transition"
            onClick={goToNextParticipant}
          >
            <span className="relative -top-px">&gt;</span>
          </button>
        </div>

        {/* Zone des post-it */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 items-start">
          {visibleNotes.map((item, noteIndex) => (
            <div
              key={noteIndex}
              className="relative bg-yellow-100 rounded-lg shadow-md p-4 min-h-37.5 flex flex-col"
            >
              <p className="text-gray-600 mb-1 text-sm">
                {item.note || <span className="text-gray-400">—</span>}
              </p>

              <div className="mt-2 space-y-2">
                {/* commentaires autres utilisateurs (lecture) */}
                {(item.commentaires ?? [])
                  .filter((c) => c.idUser !== currentIdUser)
                  .map((c) => (
                    <div key={c.id} className="bg-transparent">
                      <p className="text-violet-500 text-xs whitespace-pre-wrap">
                        {c.text}
                      </p>
                    </div>
                  ))}

                {/* commentaires utilisateur courant (édition) */}
                {(item.commentaires ?? [])
                  .filter((c) => c.idUser === currentIdUser)
                  .map((c) => (
                    <div
                      key={c.id}
                      className="relative bg-violet-100 border border-violet-200 rounded-lg p-2"
                    >
                      <textarea
                        className="w-full bg-transparent resize-none focus:outline-none text-gray-800 text-sm"
                        placeholder="Ajouter un commentaire…"
                        value={c.text}
                        onChange={(e) =>
                          updateComment(noteIndex, c.id, e.target.value)
                        }
                        rows={2}
                      />

                      <button
                        onClick={() => removeComment(noteIndex, c.id)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xs"
                        aria-label="Supprimer le commentaire"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
              </div>

              {/* Ajouter un commentaire uniquement sur les notes des autres utilisateurs */}
              {!isOwnNotes && (
                <button
                  onClick={() => addComment(noteIndex)}
                  className="absolute bottom-3 right-3 w-5 h-5 -mb-1 -mr-1 rounded-full bg-violet-500 text-white text-xs flex items-center justify-center shadow-md hover:bg-violet-600 transition"
                  aria-label="Ajouter un commentaire"
                >
                  +
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Step3;