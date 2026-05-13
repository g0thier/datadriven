import { useMemo } from "react";
import WorkshopStepLayout from "../../WorkshopStepLayout.jsx";
import MindMappingResultsBoard from "../MindMappingResultsBoard.jsx";
import { buildRankedConceptCards } from "../mindMapping.results.js";

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
    String(collaboration?.description || "").trim() ||
    "Le sujet sera visible ici dès qu'il est défini à l'étape 1.";

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
      <MindMappingResultsBoard
        challenge={challenge}
        syncError={syncError}
        rankedConceptCards={rankedConceptCards}
        isLoading={isLoading}
        isEditableReformulation
        onReformulationChange={handleReformulationChange}
      />
    </WorkshopStepLayout>
  );
}

export default Step6;
