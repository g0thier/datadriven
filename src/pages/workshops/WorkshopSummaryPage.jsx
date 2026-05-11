/**
 * @module workshops/WorkshopSummaryPage
 * @description Summary router component that selects a workshop-specific summary view.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import ContinueStopTrySummary from "./continue-stop-try/ContinueStopTrySummary.jsx";
import PaperBrainSummary from "./paper-brain/PaperBrainSummary.jsx";
import DefectuologieSummary from "./defectuologie/DefectuologieSummary.jsx";
import SixHatsSummary from "./six-hats/SixHatsSummary.jsx";
import MindMappingSummary from "./mind-mapping/MindMappingSummary.jsx";
import SpeedBoatSummary from "./speed-boat/SpeedBoatSummary.jsx";
import MatriceCroiseeSummary from "./matrice-croisee/MatriceCroiseeSummary.jsx";
import DesignThinkingSummary from "./design-thinking/DesignThinkingSummary.jsx";
import WorldCoffeeSummary from "./world-coffee/WorldCoffeeSummary.jsx";

function GenericWorkshopSummary({ sessionTitle }) {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-200 py-12 px-6">
      <div className="min-h-screen pr-86">
        <div className="bg-white rounded-2xl shadow-md p-8">
          <p className="text-sm uppercase tracking-wide text-gray-500 mb-2">Atelier terminé</p>
          <h1 className="text-3xl font-bold text-gray-800 mb-3">{sessionTitle}</h1>
          <p className="text-gray-600">
            Le récapitulatif détaillé de cet atelier sera bientôt disponible.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Renders the summary page for a completed workshop.
 * Selects a workshop-specific summary component when available.
 *
 * @param {Object} props - Component props.
 * @param {string} props.workshopId - Workshop identifier (for example: "paper-brain").
 * @param {string} props.sessionTitle - Session title displayed in the summary view.
 * @param {Object} props.collaboration - Collaboration state payload forwarded to workshop summaries.
 * @returns {JSX.Element} The rendered workshop summary page.
 */
export default function WorkshopSummaryPage({ workshopId, sessionTitle, collaboration }) {
  if (workshopId === "paper-brain") {
    return <PaperBrainSummary sessionTitle={sessionTitle} collaboration={collaboration} />;
  }

  if (workshopId === "continue-arrete-tente" || workshopId === "continue-stop-try") {
    return (
      <ContinueStopTrySummary
        sessionTitle={sessionTitle}
        collaboration={collaboration}
      />
    );
  }

  if (workshopId === "defectuologie") {
    return (
      <DefectuologieSummary
        sessionTitle={sessionTitle}
        collaboration={collaboration}
      />
    );
  }

  if (workshopId === "six-chapeaux-bono") {
    return (
      <SixHatsSummary
        sessionTitle={sessionTitle}
        collaboration={collaboration}
      />
    );
  }

  if (workshopId === "mind-mapping") {
    return (
      <MindMappingSummary
        sessionTitle={sessionTitle}
        collaboration={collaboration}
      />
    );
  }

  if (workshopId === "speed-boat") {
    return (
      <SpeedBoatSummary
        sessionTitle={sessionTitle}
        collaboration={collaboration}
      />
    );
  }

  if (workshopId === "matrice-croisee") {
    return (
      <MatriceCroiseeSummary
        sessionTitle={sessionTitle}
        collaboration={collaboration}
      />
    );
  }

  if (workshopId === "design-thinking") {
    return (
      <DesignThinkingSummary
        sessionTitle={sessionTitle}
        collaboration={collaboration}
      />
    );
  }

  if (workshopId === "world-cafe") {
    return (
      <WorldCoffeeSummary
        sessionTitle={sessionTitle}
        collaboration={collaboration}
      />
    );
  }

  return <GenericWorkshopSummary sessionTitle={sessionTitle} />;
}
