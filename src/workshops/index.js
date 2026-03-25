/**
 * @module workshops/index
 * @description Workshop registry exports used to list and resolve available workshops.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import { paperBrain } from "./paper-brain/data.js";
// import { sixHats } from "./six-hats/data.js";

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
  // "six-hats": sixHats,
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