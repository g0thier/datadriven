import WorkshopSummaryLayout from "../../../components/workshops/WorkshopSummaryLayout.jsx";
import WorkshopSyncErrorAlert from "../../../components/workshops/WorkshopSyncErrorAlert.jsx";
import SixHatsResultsBoard from "./SixHatsResultsBoard.jsx";

export default function SixHatsSummary({ sessionTitle, collaboration }) {
  const syncError = collaboration?.syncError || "";
  const step1Description = String(collaboration?.step1Description || "");
  const blueConclusion = String(collaboration?.blueConclusion || "");
  const itemsByHat = collaboration?.itemsByHat && typeof collaboration.itemsByHat === "object"
    ? collaboration.itemsByHat
    : {};

  return (
    <WorkshopSummaryLayout sessionTitle={sessionTitle}>
      <WorkshopSyncErrorAlert message={syncError} className="mb-4" />

      <SixHatsResultsBoard
        step1Description={step1Description}
        itemsByHat={itemsByHat}
        blueConclusion={blueConclusion}
      />
    </WorkshopSummaryLayout>
  );
}
