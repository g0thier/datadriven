/**
 * @module workshops/WorkshopSummaryPage
 * @description Summary router component that selects a workshop-specific summary view.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import PaperBrainSummary from "./paper-brain/PaperBrainSummary.jsx";

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
 *
 * @example
 * import WorkshopSummaryPage from "./WorkshopSummaryPage.jsx";
 *
 * // Real usage reference: src/workshops/WorkshopRunner.jsx
 * <WorkshopSummaryPage
 *   workshopId={resolvedWorkshopId}
 *   sessionTitle={sessionData.title}
 *   collaboration={collaboration}
 * />;
 *
 * // Workshop-specific summary callsite:
 * // - src/workshops/WorkshopSummaryPage.jsx -> <PaperBrainSummary ... />
 */
export default function WorkshopSummaryPage({ workshopId, sessionTitle, collaboration }) {
  if (workshopId === "paper-brain") {
    return (
      <PaperBrainSummary
        sessionTitle={sessionTitle}
        collaboration={collaboration}
      />
    );
  }

  return <GenericWorkshopSummary sessionTitle={sessionTitle} />;
}
