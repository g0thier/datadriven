/**
 * @module workshops/index
 * @description Workshop registry exports used to list and resolve available workshops.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import { continueArreteTente } from "./continue-stop-try/data.js";
import { defectuologie } from "./defectuologie/data.js";
import { designThinking } from "./design-thinking/data.js";
import { matricesCroisees } from "./matrices-croisees/data.js";
import { mindMapping } from "./mind-mapping/data.js";
import { paperBrain } from "./paper-brain/data.js";
import { sixChapeauxBono } from "./six-hats/data.js";
import { speedBoat } from "./speed-boat/data.js";
import { worldCafe } from "./world-coffee/data.js";

/**
 * Registry object containing all available workshop configurations.
 *
 * @type {Object<string, Object>}
 * @example
 * import { WORKSHOPS } from "../workshops";
 *
 * // Real usage references:
 * // - src/components/innovation/Cards.jsx (Object.values(WORKSHOPS))
 * // - src/hooks/useWorkshopInvitation.js (Object.values/keys lookups)
 * const workshopCards = Object.values(WORKSHOPS || {});
 */
export const WORKSHOPS = {
  "paper-brain": paperBrain,
  "continue-arrete-tente": continueArreteTente,
  "defectuologie": defectuologie,
  "speed-boat": speedBoat,
  "matrices-croisees": matricesCroisees,
  "mind-mapping": mindMapping,
  "six-chapeaux-bono": sixChapeauxBono,

  "design-thinking": designThinking,
  "world-cafe": worldCafe,
};

/**
 * Resolves a workshop configuration by id.
 *
 * @param {string} id - Workshop id (for example: "paper-brain").
 * @returns {Object|undefined} Workshop configuration object, or undefined when unknown.
 *
 * @example
 * import { getWorkshop } from "../workshops";
 *
 * // Real usage references:
 * // - src/workshops/WorkshopRunner.jsx
 * // - src/hooks/useWorkshopInvitation.js
 * const workshop = getWorkshop(workshopId);
 */
export function getWorkshop(id) {
  return WORKSHOPS[id];
}
