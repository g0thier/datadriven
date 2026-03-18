// Voir les routes dans constants/navigationLinks.js & app.jsx

export const APP_ROLES = {
  OWNER: "owner", // full access
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
