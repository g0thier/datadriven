import { useState } from "react";
import { data } from "../../../components/StepTimeData";

function Step3() {
  const challenge =
    "Comment pourrions-nous inventer un produit antistress pour cadres en burn-out ?";

  const [notes, setNotes] = useState([
    {
      note: "Une app de micro-pauses guidées de 3 minutes, intégrée au calendrier pro.",
      commentaires: [
        {
          id: crypto.randomUUID(),
          idUser: 1,
          text: "J'aime l'idée de micro-pauses, ça peut vraiment aider à réduire le stress au travail.",
        },
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
  ]);

  const [currentIdUser, setCurrentIdUser] = useState(1); // Simule l'utilisateur connecté

  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);

  const goToPreviousNote = () => {
    setCurrentNoteIndex((prev) =>
      prev === 0 ? notes.length - 1 : prev - 1
    );
  };

  const goToNextNote = () => {
    setCurrentNoteIndex((prev) =>
      prev === notes.length - 1 ? 0 : prev + 1
    );
  };

  // --- COMMENTAIRES ---
  const addComment = (noteIndex) => {
    setNotes((prev) =>
      prev.map((n, i) => {
        if (i !== noteIndex) return n;

        return {
          ...n,
          commentaires: [
            ...(n.commentaires ?? []),
            {
              id: crypto.randomUUID(), // ✅ ID unique
              idUser: currentIdUser,
              text: "",
            },
          ],
        };
      })
    );
  };

  const updateComment = (noteIndex, commentId, value) => {
    setNotes((prev) =>
      prev.map((n, i) => {
        if (i !== noteIndex) return n;

        return {
          ...n,
          commentaires: n.commentaires.map((c) =>
            c.id === commentId ? { ...c, text: value } : c
          ),
        };
      })
    );
  };

  const removeComment = (noteIndex, commentId) => {
    setNotes((prev) =>
      prev.map((n, i) => {
        if (i !== noteIndex) return n;

        return {
          ...n,
          commentaires: n.commentaires.filter((c) => c.id !== commentId),
        };
      })
    );
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-200 py-12 px-6">
      <div className="min-h-screen lg:mr-86">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">{data.title}</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          {data.steps[2].label}
        </h2>

        {/* description de l'étape */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          {data.steps[2].description.map((item, index) => (
            <p key={index} className="text-gray-600 mb-1 text-sm">
              {item}
            </p>
          ))}
        </div>

        {/* challenge proposé */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-4">
          <p className="text-gray-600 mb-1 text-sm">{challenge}</p>
        </div>

        {/* navigation entre les différentes notes utilisateur */}
        <div className="flex justify-between items-center col-span-full mb-3 px-2">
          <button className="rounded-full bg-violet-500 text-white w-8 h-8 flex items-center justify-center shadow-md hover:bg-violet-600 transition"
            onClick={goToPreviousNote}>
            <span className="relative -top-px">&lt;</span>
          </button>

          <p className="text-gray-600 text-sm">Notes du participant {currentNoteIndex + 1}/{notes.length}</p>

          <button className="rounded-full bg-violet-500 text-white w-8 h-8 flex items-center justify-center shadow-md hover:bg-violet-600 transition"
            onClick={goToNextNote}>
            <span className="relative -top-px">&gt;</span>
          </button>

        </div>

        {/* Zone des post-it */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 items-start">
          {notes.map((item, index) => {
            const isLast = index === notes.length - 1;

            return (
              <div
                key={index}
                className="relative bg-yellow-100 rounded-lg shadow-md p-4 min-h-37.5 flex flex-col"
              >
                {/* NOTE (non modifiable) */}
                <p className="text-gray-600 mb-1 text-sm">
                  {item.note || <span className="text-gray-400">—</span>}
                </p>

                {/* COMMENTAIRES */}
                <div className="mt-2 space-y-2">

                  {/* commentaires autres utilisateur  (affichage)  */}
                  {(item.commentaires ?? [])
                    .filter((c) => c.idUser !== currentIdUser)
                    .map((c) => (
                      <div key={c.id} className="bg-transparent">
                        <p className="text-violet-500 text-xs whitespace-pre-wrap">
                          {c.text}
                        </p>
                      </div>
                    ))}

                  {/* Commentaire utilisateur courant (modifiable) */}
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
                            updateComment(index, c.id, e.target.value)
                          }
                          rows={2}
                        />

                        <button
                          onClick={() => removeComment(index, c.id)}
                          className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xs"
                          aria-label="Supprimer le commentaire"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                </div>

                {/* + : ajoute un commentaire SUR CETTE NOTE */}
                <button
                  onClick={() => addComment(index)}
                  className="absolute bottom-3 right-3 w-5 h-5 -mb-1 -mr-1 rounded-full bg-violet-500 text-white text-xs flex items-center justify-center shadow-md hover:bg-violet-600 transition"
                  aria-label="Ajouter un commentaire"
                >
                  +
                </button>
                
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Step3;