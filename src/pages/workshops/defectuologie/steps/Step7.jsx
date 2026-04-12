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
      {!!syncError && (
        <p className="mb-3 text-sm text-red-600" role="alert">
          {syncError}
        </p>
      )}

      <DefectuologieResultsBoard
        resultsBySubgroup={resultsBySubgroup}
        step1Description={step1Description}
      />
    </WorkshopStepLayout>
  );
}
