/**
 * @module workshops/WorkshopSelector
 * @description Workshop collaboration selector that routes runtime to the matching collaboration bridge.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import { usePaperBrainCollaboration } from "./paper-brain/usePaperBrainCollaboration.js";
import { useContinueStopTryCollaboration } from "./continue-stop-try/useContinueStopTryCollaboration.js";
import { useDefectuologieCollaboration } from "./defectuologie/useDefectuologieCollaboration.js";

/**
 * Paper Brain collaboration bridge.
 *
 * @param {Object} props - Component props.
 * @param {string} props.sessionId - Active workshop session id.
 * @param {Object} props.session - Session payload.
 * @param {string} props.workshopId - Resolved workshop id.
 * @param {(collaboration:Object)=>JSX.Element} props.children - Render function receiving collaboration.
 * @returns {JSX.Element|null} Rendered content.
 */
function PaperBrainBridge({ sessionId, session, workshopId, children }) {
  const collaboration = usePaperBrainCollaboration({
    sessionId,
    session,
    workshopId,
  });

  if (typeof children !== "function") return null;
  return children(collaboration);
}

/**
 * Continue Stop Try collaboration bridge.
 *
 * @param {Object} props - Component props.
 * @param {string} props.sessionId - Active workshop session id.
 * @param {Object} props.session - Session payload.
 * @param {string} props.workshopId - Resolved workshop id.
 * @param {(collaboration:Object)=>JSX.Element} props.children - Render function receiving collaboration.
 * @returns {JSX.Element|null} Rendered content.
 */
function ContinueStopTryBridge({ sessionId, session, workshopId, children }) {
  const collaboration = useContinueStopTryCollaboration({
    sessionId,
    session,
    workshopId,
  });

  if (typeof children !== "function") return null;
  return children(collaboration);
}

/**
 * Defectuologie collaboration bridge.
 *
 * @param {Object} props - Component props.
 * @param {string} props.sessionId - Active workshop session id.
 * @param {Object} props.session - Session payload.
 * @param {string} props.workshopId - Resolved workshop id.
 * @param {(collaboration:Object)=>JSX.Element} props.children - Render function receiving collaboration.
 * @returns {JSX.Element|null} Rendered content.
 */
function DefectuologieBridge({ sessionId, session, workshopId, children }) {
  const collaboration = useDefectuologieCollaboration({
    sessionId,
    session,
    workshopId,
  });

  if (typeof children !== "function") return null;
  return children(collaboration);
}

const WORKSHOP_BRIDGES = {
  "paper-brain": PaperBrainBridge,
  "continue-arrete-tente": ContinueStopTryBridge,
  "continue-stop-try": ContinueStopTryBridge,
  "defectuologie": DefectuologieBridge,
};

/**
 * Selects the collaboration bridge for the current workshop.
 *
 * @param {Object} props - Selector props.
 * @param {string} props.workshopId - Resolved workshop id.
 * @param {string} props.sessionId - Active workshop session id.
 * @param {Object} props.session - Session payload.
 * @param {(collaboration:Object)=>JSX.Element} props.children - Render function receiving collaboration.
 * @returns {JSX.Element} Rendered bridge output or error state.
 */
export default function WorkshopSelector({ workshopId, sessionId, session, children }) {
  const CollaborationBridge = WORKSHOP_BRIDGES[workshopId];

  if (!CollaborationBridge) {
    return (
      <div className="p-10">
        Système de collaboration introuvable pour l'atelier : {workshopId}
      </div>
    );
  }

  return (
    <CollaborationBridge
      sessionId={sessionId}
      session={session}
      workshopId={workshopId}
    >
      {children}
    </CollaborationBridge>
  );
}
