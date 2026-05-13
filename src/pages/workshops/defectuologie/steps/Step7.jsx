import WorkshopSyncErrorAlert from "../../../../components/workshops/WorkshopSyncErrorAlert.jsx";
import WorkshopStepLayout from "../../WorkshopStepLayout.jsx";
import DefectuologieResultsBoard from "../DefectuologieResultsBoard.jsx";

export default function Step7({ step, sessionTitle, collaboration }) {
  const syncError = collaboration?.syncError || "";
  const description = String(collaboration?.description || "");
  const resultsBySubgroup = Array.isArray(collaboration?.resultsBySubgroup)
    ? collaboration.resultsBySubgroup
    : [];

  return (
    <WorkshopStepLayout title={sessionTitle} stepLabel={step.label} description={step.description}>
      <WorkshopSyncErrorAlert message={syncError} className="mb-3" />

      <DefectuologieResultsBoard
        resultsBySubgroup={resultsBySubgroup}
        description={description}
      />
    </WorkshopStepLayout>
  );
}
