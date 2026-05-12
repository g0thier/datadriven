/**
 * @module workshops/index
 * @description Workshop registry exports used to list and resolve available workshops.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import { lazy } from "react";
import { continueArreteTente } from "./continue-stop-try/data.js";
import { defectuologie } from "./defectuologie/data.js";
import { designThinking } from "./design-thinking/data.js";
import { matriceCroisee } from "./matrice-croisee/data.js";
import { mindMapping } from "./mind-mapping/data.js";
import { paperBrain } from "./paper-brain/data.js";
import { sixChapeauxBono } from "./six-hats/data.js";
import { speedBoat } from "./speed-boat/data.js";
import { worldCafe } from "./world-coffee/data.js";

const PaperBrainBridge = lazy(() =>
  import("./workshopRuntimeBridges.jsx").then((module) => ({
    default: module.PaperBrainBridge,
  }))
);
const ContinueStopTryBridge = lazy(() =>
  import("./workshopRuntimeBridges.jsx").then((module) => ({
    default: module.ContinueStopTryBridge,
  }))
);
const DefectuologieBridge = lazy(() =>
  import("./workshopRuntimeBridges.jsx").then((module) => ({
    default: module.DefectuologieBridge,
  }))
);
const SixHatsBridge = lazy(() =>
  import("./workshopRuntimeBridges.jsx").then((module) => ({
    default: module.SixHatsBridge,
  }))
);
const MindMappingBridge = lazy(() =>
  import("./workshopRuntimeBridges.jsx").then((module) => ({
    default: module.MindMappingBridge,
  }))
);
const SpeedBoatBridge = lazy(() =>
  import("./workshopRuntimeBridges.jsx").then((module) => ({
    default: module.SpeedBoatBridge,
  }))
);
const MatriceCroiseeBridge = lazy(() =>
  import("./workshopRuntimeBridges.jsx").then((module) => ({
    default: module.MatriceCroiseeBridge,
  }))
);
const DesignThinkingBridge = lazy(() =>
  import("./workshopRuntimeBridges.jsx").then((module) => ({
    default: module.DesignThinkingBridge,
  }))
);
const WorldCoffeeBridge = lazy(() =>
  import("./workshopRuntimeBridges.jsx").then((module) => ({
    default: module.WorldCoffeeBridge,
  }))
);

const PaperBrainSummary = lazy(() => import("./paper-brain/PaperBrainSummary.jsx"));
const ContinueStopTrySummary = lazy(() =>
  import("./continue-stop-try/ContinueStopTrySummary.jsx")
);
const DefectuologieSummary = lazy(() =>
  import("./defectuologie/DefectuologieSummary.jsx")
);
const SixHatsSummary = lazy(() => import("./six-hats/SixHatsSummary.jsx"));
const MindMappingSummary = lazy(() =>
  import("./mind-mapping/MindMappingSummary.jsx")
);
const SpeedBoatSummary = lazy(() => import("./speed-boat/SpeedBoatSummary.jsx"));
const MatriceCroiseeSummary = lazy(() =>
  import("./matrice-croisee/MatriceCroiseeSummary.jsx")
);
const DesignThinkingSummary = lazy(() =>
  import("./design-thinking/DesignThinkingSummary.jsx")
);
const WorldCoffeeSummary = lazy(() =>
  import("./world-coffee/WorldCoffeeSummary.jsx")
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
export const WORKSHOPS = {
  "paper-brain": paperBrain,
  "continue-arrete-tente": continueArreteTente,
  "defectuologie": defectuologie,
  "speed-boat": speedBoat,
  "matrice-croisee": matriceCroisee,
  "mind-mapping": mindMapping,
  "six-chapeaux-bono": sixChapeauxBono,
  "design-thinking": designThinking,
  "world-cafe": worldCafe,
};

export const WORKSHOP_RUNTIME = {
  "paper-brain": {
    bridge: PaperBrainBridge,
    summary: PaperBrainSummary,
  },
  "continue-arrete-tente": {
    bridge: ContinueStopTryBridge,
    summary: ContinueStopTrySummary,
  },
  "defectuologie": {
    bridge: DefectuologieBridge,
    summary: DefectuologieSummary,
  },
  "six-chapeaux-bono": {
    bridge: SixHatsBridge,
    summary: SixHatsSummary,
  },
  "mind-mapping": {
    bridge: MindMappingBridge,
    summary: MindMappingSummary,
  },
  "speed-boat": {
    bridge: SpeedBoatBridge,
    summary: SpeedBoatSummary,
  },
  "matrice-croisee": {
    bridge: MatriceCroiseeBridge,
    summary: MatriceCroiseeSummary,
  },
  "design-thinking": {
    bridge: DesignThinkingBridge,
    summary: DesignThinkingSummary,
  },
  "world-cafe": {
    bridge: WorldCoffeeBridge,
    summary: WorldCoffeeSummary,
  },
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

/**
 * Resolves runtime workshop components (collaboration bridge + summary) by id.
 *
 * @param {string} id - Workshop id.
 * @returns {{bridge:React.ComponentType, summary:React.ComponentType}|undefined}
 */
export function getWorkshopRuntime(id) {
  return WORKSHOP_RUNTIME[id];
}
