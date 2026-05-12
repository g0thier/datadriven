import WorkshopSyncErrorAlert from "../../../../components/workshops/WorkshopSyncErrorAlert.jsx";
import WorkshopStepLayout from "../../WorkshopStepLayout.jsx";
import SixHatsResultsBoard from "../SixHatsResultsBoard.jsx";

export default function Step7({ step, sessionTitle, collaboration }) {
  const syncError = collaboration?.syncError || "";
  const isLoading = Boolean(collaboration?.isLoading);
  const step1Description = String(collaboration?.step1Description || "");
  const blueConclusion = String(collaboration?.blueConclusion || "");
  const itemsByHat =
    collaboration?.itemsByHat && typeof collaboration.itemsByHat === "object"
      ? collaboration.itemsByHat
      : {};

  const handleBlueConclusionChange = (nextValue) => {
    if (isLoading || nextValue === blueConclusion) return;
    collaboration?.actions?.setBlueConclusion?.(nextValue);
  };

  return (
    <WorkshopStepLayout title={sessionTitle} stepLabel={step.label} description={step.description}>
      <WorkshopSyncErrorAlert message={syncError} className="mb-3" />

      <SixHatsResultsBoard
        step1Description={step1Description}
        itemsByHat={itemsByHat}
        blueConclusion={blueConclusion}
        isBlueEditable
        isLoading={isLoading}
        onBlueConclusionChange={handleBlueConclusionChange}
      />
    </WorkshopStepLayout>
  );
}
