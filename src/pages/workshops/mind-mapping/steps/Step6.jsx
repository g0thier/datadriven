import { useMemo } from "react";
import WorkshopStepLayout from "../../WorkshopStepLayout.jsx";

const compareByCreatedAt = (a, b) => {
  const createdA = String(a?.createdAt || "");
  const createdB = String(b?.createdAt || "");

  if (createdA !== createdB) {
    return createdA.localeCompare(createdB);
  }

  return String(a?.id || "").localeCompare(String(b?.id || ""));
};

function resolveDisplayText(value, fallback) {
  const normalized = String(value || "").trim();
  return normalized || fallback;
}

function Step6({ step, sessionTitle, collaboration }) {
  const notes = useMemo(() => collaboration?.notes ?? [], [collaboration?.notes]);
  const commentsByNote = useMemo(
    () => collaboration?.commentsByNote || {},
    [collaboration?.commentsByNote]
  );
  const concepts = useMemo(() => collaboration?.concepts ?? [], [collaboration?.concepts]);
  const votesByConcept = useMemo(
    () => collaboration?.votesByConcept || {},
    [collaboration?.votesByConcept]
  );
  const reformulationsByConcept = useMemo(
    () => collaboration?.reformulationsByConcept || {},
    [collaboration?.reformulationsByConcept]
  );

  const isLoading = Boolean(collaboration?.isLoading);
  const syncError = collaboration?.syncError || "";
  const setReformulationAction = collaboration?.actions?.setReformulation;

  const challenge =
    String(collaboration?.step1Description || "").trim() ||
    "Le sujet sera visible ici des qu'il est defini a l'etape 1.";

  const notesById = useMemo(() => {
    return notes.reduce((accumulator, note) => {
      accumulator[note.id] = note;
      return accumulator;
    }, {});
  }, [notes]);

  const ideasByNoteAndId = useMemo(() => {
    return Object.entries(commentsByNote).reduce((accumulator, [noteId, comments]) => {
      if (!Array.isArray(comments)) {
        accumulator[noteId] = {};
        return accumulator;
      }

      accumulator[noteId] = comments.reduce((commentsAccumulator, comment) => {
        commentsAccumulator[comment.id] = comment;
        return commentsAccumulator;
      }, {});

      return accumulator;
    }, {});
  }, [commentsByNote]);

  const rankedConceptCards = useMemo(() => {
    return concepts
      .map((concept) => {
        const voteSet = votesByConcept[concept.id];
        const voteCount = voteSet instanceof Set ? voteSet.size : 0;
        if (voteCount <= 0) return null;

        const fromNote = notesById[concept?.from?.noteId] || null;
        const toNote = notesById[concept?.to?.noteId] || null;
        const fromIdea = ideasByNoteAndId[concept?.from?.noteId]?.[concept?.from?.ideaId] || null;
        const toIdea = ideasByNoteAndId[concept?.to?.noteId]?.[concept?.to?.ideaId] || null;
        const reformulationText = String(reformulationsByConcept?.[concept.id]?.text || "");

        return {
          concept,
          voteCount,
          reformulationText,
          fromNoteText: resolveDisplayText(fromNote?.text, "Note supprimee"),
          fromIdeaText: resolveDisplayText(fromIdea?.text, "Idee supprimee"),
          conceptText: resolveDisplayText(concept?.text, "Concept vide"),
          toIdeaText: resolveDisplayText(toIdea?.text, "Idee supprimee"),
          toNoteText: resolveDisplayText(toNote?.text, "Note supprimee"),
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (b.voteCount !== a.voteCount) return b.voteCount - a.voteCount;
        return compareByCreatedAt(a.concept, b.concept);
      });
  }, [concepts, ideasByNoteAndId, notesById, reformulationsByConcept, votesByConcept]);

  const handleReformulationChange = (conceptId, nextText, currentText) => {
    if (isLoading) return;
    if (nextText === currentText) return;
    setReformulationAction?.(conceptId, nextText);
  };

  return (
    <WorkshopStepLayout
      title={sessionTitle}
      stepLabel={step.label}
      description={step.description}
    >
      <div className="bg-white rounded-2xl shadow-md p-6 mb-4">
        <p className="text-gray-600 mb-1 text-sm">{challenge}</p>
      </div>

      {!!syncError && (
        <p className="mb-3 text-sm text-red-600" role="alert">
          {syncError}
        </p>
      )}

      {rankedConceptCards.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-md p-8 text-center text-gray-500">
          Aucun concept avec gommette pour le moment.
        </div>
      ) : (
        <div className="space-y-4">
          {rankedConceptCards.map((item) => (
            <article key={item.concept.id} className="bg-white rounded-2xl shadow-md p-4">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h3 className="text-sm font-semibold text-gray-800">Concept</h3>
                <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 px-3 py-1 text-xs font-semibold">
                  {item.voteCount} vote{item.voteCount > 1 ? "s" : ""}
                </span>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-5 gap-3">
                <section className="rounded-xl border border-yellow-200 bg-yellow-100 p-3">
                  <p className="text-xs uppercase tracking-wide text-yellow-700 mb-1">Note 1</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.fromNoteText}</p>
                </section>

                <section className="rounded-xl border border-blue-200 bg-blue-100 p-3">
                  <p className="text-xs uppercase tracking-wide text-blue-700 mb-1">Idee 1</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.fromIdeaText}</p>
                </section>

                <section className="rounded-xl border border-orange-200 bg-orange-100 p-3">
                  <p className="text-xs uppercase tracking-wide text-orange-700 mb-1">Concept</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.conceptText}</p>
                </section>

                <section className="rounded-xl border border-blue-200 bg-blue-100 p-3">
                  <p className="text-xs uppercase tracking-wide text-blue-700 mb-1">Idee 2</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.toIdeaText}</p>
                </section>

                <section className="rounded-xl border border-yellow-200 bg-yellow-100 p-3">
                  <p className="text-xs uppercase tracking-wide text-yellow-700 mb-1">Note 2</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.toNoteText}</p>
                </section>
              </div>

              <textarea
                  className="w-full h-28 p-3 mt-3 bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                  placeholder="Reformuler l'idee finale..."
                  value={item.reformulationText}
                  onChange={(event) =>
                  handleReformulationChange(
                      item.concept.id,
                      event.target.value,
                      item.reformulationText
                  )
                  }
                  disabled={isLoading}
              />

            </article>
          ))}
        </div>
      )}
    </WorkshopStepLayout>
  );
}

export default Step6;
