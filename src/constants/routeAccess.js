/**
 * @module constants/routeAccess
 * @description Route access constants by role, including over-capacity allowances.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

/**
 * Supported application role keys.
 * @type {{OWNER:string, LEADER:string, COLAB:string}}
 */
export const APP_ROLES = {
  OWNER: "owner", // full access sauf mode over-capacity
  LEADER: "leader", // access selon page management
  COLAB: "colab", // restriction ci-dessous
};

/**
 * Default fallback path for collaborators when a route is not authorized.
 * @type {string}
 */
export const COLAB_DEFAULT_REDIRECT_PATH = "/soon";

/**
 * Routes that are forbidden to collaborator profiles.
 * @type {string[]}
 */
export const COLAB_RESTRICTED_LINKS = [
  "/innovation/ateliers",
  "/team",
  "/team/annuaire",
  "/team/motivation",
  "/team/motivation/invitation",
  "/team/motivation/scheduled",
  "/management",
  "/management/comptes",
  "/management/abonnement",
];

/**
 * Routes temporarily allowed for owner/leader when subscription capacity is exceeded.
 * @type {string[]}
 */
export const OVER_CAPACITY_ALLOWED_LINKS = [
  "/team",
  "/team/annuaire",
  "/management",
  "/management/comptes",
  "/management/abonnement",
];
