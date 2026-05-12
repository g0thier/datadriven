/**
 * @module workshops/index
 * @description Workshop registry exports used to list and resolve available workshops.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import { lazy } from "react";
import { WORKSHOP_BRIDGES } from "./workshopBridgeRegistry.js";

const WORKSHOP_DATA_MODULES = import.meta.glob("./*/data.js", {
  eager: true,
  import: "default",
});

const WORKSHOP_SUMMARY_LOADERS = import.meta.glob("./*/Summary.jsx");

const WORKSHOP_ORDER = [
  "paper-brain",
  "continue-arrete-tente",
  "defectuologie",
  "speed-boat",
  "matrice-croisee",
  "mind-mapping",
  "six-chapeaux-bono",
  "design-thinking",
  "world-cafe",
];

function extractWorkshopFolderFromPath(path) {
  const match = /^\.\/([^/]+)\//.exec(path);
  return match?.[1] || "";
}

const workshopFolderById = {};
const workshopByIdUnordered = {};

for (const [path, workshop] of Object.entries(WORKSHOP_DATA_MODULES)) {
  if (!workshop || typeof workshop !== "object") continue;

  const workshopId = String(workshop.id || "").trim();
  if (!workshopId) continue;

  workshopByIdUnordered[workshopId] = workshop;
  workshopFolderById[workshopId] = extractWorkshopFolderFromPath(path);
}

const orderedWorkshopIds = [...new Set([...WORKSHOP_ORDER, ...Object.keys(workshopByIdUnordered)])].filter(
  (id) => Boolean(workshopByIdUnordered[id])
);

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
export const WORKSHOPS = orderedWorkshopIds.reduce((accumulator, workshopId) => {
  accumulator[workshopId] = workshopByIdUnordered[workshopId];
  return accumulator;
}, {});

const summaryByWorkshopId = {};

for (const workshopId of Object.keys(WORKSHOPS)) {
  const workshopFolder = workshopFolderById[workshopId];
  const summaryPath = `./${workshopFolder}/Summary.jsx`;
  const summaryLoader = WORKSHOP_SUMMARY_LOADERS[summaryPath];

  if (typeof summaryLoader === "function") {
    summaryByWorkshopId[workshopId] = lazy(summaryLoader);
  }
}

export const WORKSHOP_RUNTIME = Object.keys(WORKSHOPS).reduce((accumulator, workshopId) => {
  accumulator[workshopId] = {
    bridge: WORKSHOP_BRIDGES[workshopId] || null,
    summary: summaryByWorkshopId[workshopId] || null,
  };

  return accumulator;
}, {});

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

/**
 * Resolves runtime workshop components (collaboration bridge + summary) by id.
 *
 * @param {string} id - Workshop id.
 * @returns {{bridge:React.ComponentType|null, summary:React.ComponentType|null}|undefined}
 */
export function getWorkshopRuntime(id) {
  return WORKSHOP_RUNTIME[id];
}
