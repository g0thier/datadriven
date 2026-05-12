import { useCollaboration as useContinueStopTryCollaboration } from "./continue-stop-try/useCollaboration.js";
import { useCollaboration as useDefectuologieCollaboration } from "./defectuologie/useCollaboration.js";
import { useCollaboration as useDesignThinkingCollaboration } from "./design-thinking/useCollaboration.js";
import { useCollaboration as useMatriceCroiseeCollaboration } from "./matrice-croisee/useCollaboration.js";
import { useCollaboration as useMindMappingCollaboration } from "./mind-mapping/useCollaboration.js";
import { useCollaboration as usePaperBrainCollaboration } from "./paper-brain/useCollaboration.js";
import { useCollaboration as useSixHatsCollaboration } from "./six-hats/useCollaboration.js";
import { useCollaboration as useSpeedBoatCollaboration } from "./speed-boat/useCollaboration.js";
import { useCollaboration as useWorldCoffeeCollaboration } from "./world-coffee/useCollaboration.js";

function renderBridgeOutput(children, collaboration) {
  if (typeof children !== "function") return null;
  return children(collaboration);
}

function createWorkshopBridge(useWorkshopCollaboration) {
  return function WorkshopRuntimeBridge({ sessionId, session, workshopId, children }) {
    const collaboration = useWorkshopCollaboration({ sessionId, session, workshopId });
    return renderBridgeOutput(children, collaboration);
  };
}

const COLLABORATION_HOOKS_BY_WORKSHOP_ID = {
  "paper-brain": usePaperBrainCollaboration,
  "continue-arrete-tente": useContinueStopTryCollaboration,
  "defectuologie": useDefectuologieCollaboration,
  "six-chapeaux-bono": useSixHatsCollaboration,
  "mind-mapping": useMindMappingCollaboration,
  "speed-boat": useSpeedBoatCollaboration,
  "matrice-croisee": useMatriceCroiseeCollaboration,
  "design-thinking": useDesignThinkingCollaboration,
  "world-cafe": useWorldCoffeeCollaboration,
};

export const WORKSHOP_BRIDGES = Object.entries(COLLABORATION_HOOKS_BY_WORKSHOP_ID).reduce(
  (accumulator, [workshopId, useWorkshopCollaboration]) => {
    accumulator[workshopId] = createWorkshopBridge(useWorkshopCollaboration);
    return accumulator;
  },
  {}
);
