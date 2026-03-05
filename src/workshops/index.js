import { paperBrain } from "./paper-brain/data.js";
// import { sixHats } from "./six-hats/data.js";

export const WORKSHOPS = {
  "paper-brain": paperBrain,
  // "six-hats": sixHats,
};

export function getWorkshop(id) {
  return WORKSHOPS[id];
}