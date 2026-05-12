import {
  ContinueStopTryBridge,
  DefectuologieBridge,
  DesignThinkingBridge,
  MatriceCroiseeBridge,
  MindMappingBridge,
  PaperBrainBridge,
  SixHatsBridge,
  SpeedBoatBridge,
  WorldCoffeeBridge,
} from "./workshopRuntimeBridges.jsx";

export const WORKSHOP_BRIDGES = {
  "paper-brain": PaperBrainBridge,
  "continue-arrete-tente": ContinueStopTryBridge,
  "defectuologie": DefectuologieBridge,
  "six-chapeaux-bono": SixHatsBridge,
  "mind-mapping": MindMappingBridge,
  "speed-boat": SpeedBoatBridge,
  "matrice-croisee": MatriceCroiseeBridge,
  "design-thinking": DesignThinkingBridge,
  "world-cafe": WorldCoffeeBridge,
};
