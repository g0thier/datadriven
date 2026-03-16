export const navbarLinks = [
  { label: "À venir", to: "/soon", icon: "select", end: true },
  { label: "À venir", to: "/soon", icon: "select", end: true },
  { label: "Innovation & Créativité", to: "/innovation", icon: "emoji_objects", end: false },
  { label: "Gestion des Ressources Humaines", to: "/team", icon: "conversation", end: true },
  { label: "À venir", to: "/soon", icon: "select", end: true },
  { label: "Gestion des accès", to: "/management", icon: "shield_toggle", end: false },
];

export const innovationLinks = [
  { label: "Innovation", to: "/innovation", icon: "emoji_objects", end: false, excludeActiveStartsWith: ["/innovation/scheduled"] },
  { label: "Mes événements", to: "/innovation/scheduled", icon: "event", end: true },
];

export const soonLinks = [
  { label: "À venir", to: "/soon", icon: "select", end: true },
  { label: "Innovation & Créativité", to: "/innovation", icon: "emoji_objects", end: false },
  { label: "Gestion des Ressources Humaines", to: "/team", icon: "conversation", end: true },
  { label: "Gestion des accès", to: "/management", icon: "shield_toggle", end: false },
];

export const teamLinks = [
  { label: "Annuaire", to: "/team", icon: "conversation", end: true },
  { label: "À venir", to: "/soon", icon: "select", end: true },
];

export const managementLinks = [
  { label: "Management", to: "/management", icon: "shield_person", end: true },
  { label: "Abonnement", to: "/management/abonnement", icon: "credit_card", end: true},
];
