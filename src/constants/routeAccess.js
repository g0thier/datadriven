// Voir les routes dans constants/navigationLinks.js & app.jsx

export const APP_ROLES = {
  OWNER: "owner", // full access sauf mode over-capacity
  LEADER: "leader", // access selon page management
  COLAB: "colab", // restriction ci-dessous
};

export const COLAB_DEFAULT_REDIRECT_PATH = "/soon";

// Liste les routes interdites aux colabs.
export const COLAB_RESTRICTED_LINKS = [
  "/innovation/ateliers",
  "/team",
  "/team/annuaire",
  "/management",
  "/management/comptes",
  "/management/abonnement",
];

// Routes accessibles temporairement pour owner/leader quand la capacité
// d'abonnement est dépassée (sous réserve des droits DB pour les leaders).
export const OVER_CAPACITY_ALLOWED_LINKS = [
  "/team",
  "/team/annuaire",
  "/management",
  "/management/comptes",
  "/management/abonnement",
];
