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

export function PaperBrainBridge({ sessionId, session, workshopId, children }) {
  const collaboration = usePaperBrainCollaboration({ sessionId, session, workshopId });
  return renderBridgeOutput(children, collaboration);
}

export function ContinueStopTryBridge({ sessionId, session, workshopId, children }) {
  const collaboration = useContinueStopTryCollaboration({ sessionId, session, workshopId });
  return renderBridgeOutput(children, collaboration);
}

export function DefectuologieBridge({ sessionId, session, workshopId, children }) {
  const collaboration = useDefectuologieCollaboration({ sessionId, session, workshopId });
  return renderBridgeOutput(children, collaboration);
}

export function SixHatsBridge({ sessionId, session, workshopId, children }) {
  const collaboration = useSixHatsCollaboration({ sessionId, session, workshopId });
  return renderBridgeOutput(children, collaboration);
}

export function MindMappingBridge({ sessionId, session, workshopId, children }) {
  const collaboration = useMindMappingCollaboration({ sessionId, session, workshopId });
  return renderBridgeOutput(children, collaboration);
}

export function SpeedBoatBridge({ sessionId, session, workshopId, children }) {
  const collaboration = useSpeedBoatCollaboration({ sessionId, session, workshopId });
  return renderBridgeOutput(children, collaboration);
}

export function MatriceCroiseeBridge({ sessionId, session, workshopId, children }) {
  const collaboration = useMatriceCroiseeCollaboration({ sessionId, session, workshopId });
  return renderBridgeOutput(children, collaboration);
}

export function DesignThinkingBridge({ sessionId, session, workshopId, children }) {
  const collaboration = useDesignThinkingCollaboration({ sessionId, session, workshopId });
  return renderBridgeOutput(children, collaboration);
}

export function WorldCoffeeBridge({ sessionId, session, workshopId, children }) {
  const collaboration = useWorldCoffeeCollaboration({ sessionId, session, workshopId });
  return renderBridgeOutput(children, collaboration);
}
