import WorkshopSummaryLayout from "../../../components/workshops/WorkshopSummaryLayout.jsx";
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
    <WorkshopSummaryLayout sessionTitle={sessionTitle}>

        <WorldCoffeeRestitutionView collaboration={collaboration} />
    </WorkshopSummaryLayout>
  );
}
