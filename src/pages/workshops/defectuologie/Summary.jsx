import WorkshopSummaryLayout from "../../../components/workshops/WorkshopSummaryLayout.jsx";
import WorkshopSyncErrorAlert from "../../../components/workshops/WorkshopSyncErrorAlert.jsx";
import DefectuologieResultsBoard from "./DefectuologieResultsBoard.jsx";

export default function DefectuologieSummary({ sessionTitle, collaboration }) {
  const syncError = collaboration?.syncError || "";
  const step1Description = String(collaboration?.step1Description || "");
  const resultsBySubgroup = Array.isArray(collaboration?.resultsBySubgroup)
    ? collaboration.resultsBySubgroup
    : [];

  return (
    <WorkshopSummaryLayout sessionTitle={sessionTitle}>
      <WorkshopSyncErrorAlert message={syncError} className="mb-4" />

      <DefectuologieResultsBoard
        resultsBySubgroup={resultsBySubgroup}
        step1Description={step1Description}
      />
    </WorkshopSummaryLayout>
  );
}
