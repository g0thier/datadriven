import { innovationLinks, managementLinks, teamLinks } from "./navigationLinks.js";

/**
 * @module constants/sectionLinks
 * @description Mapping of section root paths to their contextual navigation links.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

/**
 * Link groups indexed by first-level section route.
 * @type {Object<string, Array<{label:string, to:string, icon:string, end:boolean}>>}
 */
export const SECTION_LINKS_BY_ROOT = {
  "/innovation": innovationLinks,
  "/team": teamLinks,
  "/management": managementLinks,
};
