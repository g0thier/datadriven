import { useContinueStopTryCollaboration } from "./continue-stop-try/useContinueStopTryCollaboration.js";
import { useDefectuologieCollaboration } from "./defectuologie/useDefectuologieCollaboration.js";
import { useDesignThinkingCollaboration } from "./design-thinking/useDesignThinkingCollaboration.js";
import { useMatriceCroiseeCollaboration } from "./matrice-croisee/useMatriceCroiseeCollaboration.js";
import { useMindMappingCollaboration } from "./mind-mapping/useMindMappingCollaboration.js";
import { usePaperBrainCollaboration } from "./paper-brain/usePaperBrainCollaboration.js";
import { useSixHatsCollaboration } from "./six-hats/useSixHatsCollaboration.js";
import { useSpeedBoatCollaboration } from "./speed-boat/useSpeedBoatCollaboration.js";
import { useWorldCoffeeCollaboration } from "./world-coffee/useWorldCoffeeCollaboration.js";

function renderBridgeOutput(children, collaboration) {
  if (typeof children !== "function") return null;
  return children(collaboration);
}

export function PaperBrainBridge({ sessionId, session, workshopId, children }) {
  const collaboration = usePaperBrainCollaboration({
    sessionId,
    session,
    workshopId,
  });

  return renderBridgeOutput(children, collaboration);
}

export function ContinueStopTryBridge({ sessionId, session, workshopId, children }) {
  const collaboration = useContinueStopTryCollaboration({
    sessionId,
    session,
    workshopId,
  });

  return renderBridgeOutput(children, collaboration);
}

export function DefectuologieBridge({ sessionId, session, workshopId, children }) {
  const collaboration = useDefectuologieCollaboration({
    sessionId,
    session,
    workshopId,
  });

  return renderBridgeOutput(children, collaboration);
}

export function SixHatsBridge({ sessionId, session, workshopId, children }) {
  const collaboration = useSixHatsCollaboration({
    sessionId,
    session,
    workshopId,
  });

  return renderBridgeOutput(children, collaboration);
}

export function MindMappingBridge({ sessionId, session, workshopId, children }) {
  const collaboration = useMindMappingCollaboration({
    sessionId,
    session,
    workshopId,
  });

  return renderBridgeOutput(children, collaboration);
}

export function SpeedBoatBridge({ sessionId, session, workshopId, children }) {
  const collaboration = useSpeedBoatCollaboration({
    sessionId,
    session,
    workshopId,
  });

  return renderBridgeOutput(children, collaboration);
}

export function MatriceCroiseeBridge({ sessionId, session, workshopId, children }) {
  const collaboration = useMatriceCroiseeCollaboration({
    sessionId,
    session,
    workshopId,
  });

  return renderBridgeOutput(children, collaboration);
}

export function DesignThinkingBridge({ sessionId, session, workshopId, children }) {
  const collaboration = useDesignThinkingCollaboration({
    sessionId,
    session,
    workshopId,
  });

  return renderBridgeOutput(children, collaboration);
}

export function WorldCoffeeBridge({ sessionId, session, workshopId, children }) {
  const collaboration = useWorldCoffeeCollaboration({
    sessionId,
    session,
    workshopId,
  });

  return renderBridgeOutput(children, collaboration);
}
