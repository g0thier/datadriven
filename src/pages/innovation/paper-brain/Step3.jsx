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
          idUser: 1,
          text: "J'aime l'idée de micro-pauses, ça peut vraiment aider à réduire le stress au travail.",
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

  // --- COMMENTAIRES ---
  const addComment = (noteIndex) => {
    setNotes((prev) =>
      prev.map((n, i) => {
        if (i !== noteIndex) return n;
        const current = n.commentaires ?? [];
        return {
          ...n,
          commentaires: [...current, { idUser: 1, text: "" }],
        };
      })
    );
  };

  const updateComment = (noteIndex, commentIndex, value) => {
    setNotes((prev) =>
      prev.map((n, i) => {
        if (i !== noteIndex) return n;
        const current = n.commentaires ?? [];
        return {
          ...n,
          commentaires: current.map((c, j) =>
            j === commentIndex ? { ...c, text: value } : c
          ),
        };
      })
    );
  };

  const removeComment = (noteIndex, commentIndex) => {
    setNotes((prev) =>
      prev.map((n, i) => {
        if (i !== noteIndex) return n;
        const current = n.commentaires ?? [];
        const next = current.filter((_, j) => j !== commentIndex);
        return { ...n, commentaires: next };
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
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <p className="text-gray-600 mb-1 text-sm">{challenge}</p>
        </div>

        {/* Zone des post-it */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
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

                {/* COMMENTAIRES (violet) */}
                <div className="mt-4 space-y-2">
                  {(item.commentaires ?? []).map((c, j) => (
                    <div
                      key={j}
                      className="relative bg-violet-100 border border-violet-200 rounded-lg p-2"
                    >
                      <textarea
                        className="w-full bg-transparent resize-none focus:outline-none text-gray-800 text-sm"
                        placeholder="Ajouter un commentaire…"
                        value={c.text}
                        onChange={(e) => updateComment(index, j, e.target.value)}
                        rows={2}
                      />

                      {/* supprimer commentaire */}
                      <button
                        onClick={() => removeComment(index, j)}
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