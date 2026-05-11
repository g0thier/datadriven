/**
 * @module workshops/world-coffee/steps/Step7
 * @description World Cafe step 7 screen for collective restitution in general channel.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import WorkshopStepLayout from "../../WorkshopStepLayout.jsx";
import WorldCoffeeRestitutionView from "../WorldCoffeeRestitutionView.jsx";

/**
 * Renders World Cafe step 7 (collective restitution with all subgroup outputs).
 *
 * @param {Object} props - Component props.
 * @param {Object} props.step - Step metadata.
 * @param {string} props.sessionTitle - Current session title.
 * @param {Object} props.collaboration - Collaboration state and actions.
 * @returns {JSX.Element} The rendered step 7 screen.
 */
export default function Step7({ step, sessionTitle, collaboration }) {
  return (
    <WorkshopStepLayout title={sessionTitle} stepLabel={step.label} description={step.description}>
      <WorldCoffeeRestitutionView collaboration={collaboration} />
    </WorkshopStepLayout>
  );
}
