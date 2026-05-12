import WorkshopSyncErrorAlert from "../../../../components/workshops/WorkshopSyncErrorAlert.jsx";
import WorkshopStepLayout from "../../WorkshopStepLayout.jsx";
import DefectuologieResultsBoard from "../DefectuologieResultsBoard.jsx";

export default function Step7({ step, sessionTitle, collaboration }) {
  const syncError = collaboration?.syncError || "";
  const step1Description = String(collaboration?.step1Description || "");
  const resultsBySubgroup = Array.isArray(collaboration?.resultsBySubgroup)
    ? collaboration.resultsBySubgroup
    : [];

  return (
    <WorkshopStepLayout title={sessionTitle} stepLabel={step.label} description={step.description}>
      <WorkshopSyncErrorAlert message={syncError} className="mb-3" />

      <DefectuologieResultsBoard
        resultsBySubgroup={resultsBySubgroup}
        step1Description={step1Description}
      />
    </WorkshopStepLayout>
  );
}
