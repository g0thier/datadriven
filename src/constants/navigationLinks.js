/**
 * @module constants/navigationLinks
 * @description Navigation link groups used across navbar and section side menus.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

/**
 * Top-level navbar links.
 * @type {Array<{label:string, to:string, icon:string, end:boolean}>}
 */
export const navbarLinks = [
  { label: "À venir", to: "/soon", icon: "select", end: true },
  { label: "À venir", to: "/soon", icon: "select", end: true },
  { label: "Innovation & Créativité", to: "/innovation", icon: "emoji_objects", end: false },
  { label: "Gestion des Ressources Humaines", to: "/team", icon: "conversation", end: true },
  { label: "À venir", to: "/soon", icon: "select", end: true },
  { label: "Gestion des accès", to: "/management", icon: "shield_toggle", end: false },
];

/**
 * Innovation section links.
 * @type {Array<{label:string, to:string, icon:string, end:boolean}>}
 */
export const innovationLinks = [
  { label: "Innovation", to: "/innovation/ateliers", icon: "emoji_objects", end: true },
  { label: "Mes événements", to: "/innovation/scheduled", icon: "event", end: true },
];

/**
 * Team section links.
 * @type {Array<{label:string, to:string, icon:string, end:boolean}>}
 */
export const teamLinks = [
  { label: "Annuaire", to: "/team/annuaire", icon: "conversation", end: true },
  { label: "À venir", to: "/soon", icon: "select", end: true },
];

/**
 * Management section links.
 * @type {Array<{label:string, to:string, icon:string, end:boolean}>}
 */
export const managementLinks = [
  { label: "Management", to: "/management/comptes", icon: "shield_person", end: true },
  { label: "Abonnement", to: "/management/abonnement", icon: "credit_card", end: true },
];

/**
 * Deduplicated links used in the "soon" area, based on navbar labels.
 * @type {Array<{label:string, to:string, icon:string, end:boolean}>}
 */
export const soonLinks = [...new Map(navbarLinks.map((item) => [item.label, item])).values()];
