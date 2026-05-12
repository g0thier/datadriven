import { useMemo } from "react";
import MindMappingResultsBoard from "./MindMappingResultsBoard.jsx";
import { buildRankedConceptCards } from "./mindMapping.results.js";

const EMPTY_ARRAY = Object.freeze([]);
const EMPTY_OBJECT = Object.freeze({});

export default function MindMappingSummary({ sessionTitle, collaboration }) {
  const notes = Array.isArray(collaboration?.notes) ? collaboration.notes : EMPTY_ARRAY;
  const commentsByNote =
    collaboration?.commentsByNote && typeof collaboration.commentsByNote === "object"
      ? collaboration.commentsByNote
      : EMPTY_OBJECT;
  const concepts = Array.isArray(collaboration?.concepts) ? collaboration.concepts : EMPTY_ARRAY;
  const votesByConcept =
    collaboration?.votesByConcept && typeof collaboration.votesByConcept === "object"
      ? collaboration.votesByConcept
      : EMPTY_OBJECT;
  const reformulationsByConcept =
    collaboration?.reformulationsByConcept &&
    typeof collaboration.reformulationsByConcept === "object"
      ? collaboration.reformulationsByConcept
      : EMPTY_OBJECT;

  const syncError = collaboration?.syncError || "";
  const challenge =
    String(collaboration?.step1Description || "").trim() ||
    "Le défi n'a pas ete renseigne pendant l'atelier.";

  const rankedConceptCards = useMemo(
    () =>
      buildRankedConceptCards({
        notes,
        commentsByNote,
        concepts,
        votesByConcept,
        reformulationsByConcept,
      }),
    [commentsByNote, concepts, notes, reformulationsByConcept, votesByConcept]
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-200 py-12 px-6">
      <div className="min-h-screen pr-86">
        <p className="text-sm uppercase tracking-wide text-gray-500 mb-2">Atelier terminé</p>
        <h1 className="text-4xl font-bold text-gray-800 mb-6">{sessionTitle}</h1>

        <MindMappingResultsBoard
          challenge={challenge}
          syncError={syncError}
          rankedConceptCards={rankedConceptCards}
        />
      </div>
    </div>
  );
}
