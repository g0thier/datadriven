/**
 * @module workshops/world-coffee/WorldCoffeeSummary
 * @description Workshop-specific summary view for the World Cafe workflow.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import WorldCoffeeRestitutionView from "./WorldCoffeeRestitutionView.jsx";

/**
 * Renders the World Cafe workshop summary screen.
 *
 * @param {Object} props - Component props.
 * @param {string} props.sessionTitle - Workshop session title.
 * @param {Object} props.collaboration - Collaboration state from useWorldCoffeeCollaboration.
 * @returns {JSX.Element} The rendered World Cafe summary.
 */
export default function WorldCoffeeSummary({ sessionTitle, collaboration }) {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-200 py-12 px-6">
      <div className="min-h-screen pr-86">
        <p className="text-sm uppercase tracking-wide text-gray-500 mb-2">Atelier terminé</p>
        <h1 className="text-4xl font-bold text-gray-800 mb-6">{sessionTitle}</h1>

        <WorldCoffeeRestitutionView collaboration={collaboration} />
      </div>
    </div>
  );
}
