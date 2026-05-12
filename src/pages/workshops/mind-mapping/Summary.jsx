import WorkshopSummaryLayout from "../../../components/workshops/WorkshopSummaryLayout.jsx";
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
    "Le défi n'a pas été renseigné pendant l'atelier.";

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
    <WorkshopSummaryLayout sessionTitle={sessionTitle}>

        <MindMappingResultsBoard
          challenge={challenge}
          syncError={syncError}
          rankedConceptCards={rankedConceptCards}
        />
    </WorkshopSummaryLayout>
  );
}
