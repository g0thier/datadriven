import WorkshopSummaryLayout from "../../../components/workshops/WorkshopSummaryLayout.jsx";
import WorkshopSyncErrorAlert from "../../../components/workshops/WorkshopSyncErrorAlert.jsx";
import DefectuologieResultsBoard from "./DefectuologieResultsBoard.jsx";

export default function DefectuologieSummary({ sessionTitle, collaboration }) {
  const syncError = collaboration?.syncError || "";
  const description = String(collaboration?.description || "");
  const resultsBySubgroup = Array.isArray(collaboration?.resultsBySubgroup)
    ? collaboration.resultsBySubgroup
    : [];

  return (
    <WorkshopSummaryLayout sessionTitle={sessionTitle}>
      <WorkshopSyncErrorAlert message={syncError} className="mb-4" />

      <DefectuologieResultsBoard
        resultsBySubgroup={resultsBySubgroup}
        description={description}
      />
    </WorkshopSummaryLayout>
  );
}
