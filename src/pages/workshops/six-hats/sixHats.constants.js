export const HAT_CONFIG = [
  {
    id: "white",
    label: "Chapeau blanc",
    noteBgClass: "bg-slate-100",
    columnBgClass: "bg-slate-50/70",
    borderClass: "border-slate-200",
    inputPlaceholder: "Partager un fait, une donnée ou une information utile...",
  },
  {
    id: "red",
    label: "Chapeau rouge",
    noteBgClass: "bg-red-100",
    columnBgClass: "bg-red-50/70",
    borderClass: "border-red-200",
    inputPlaceholder: "Exprimer un ressenti, une intuition ou une perception...",
  },
  {
    id: "black",
    label: "Chapeau noir",
    noteBgClass: "bg-zinc-200",
    columnBgClass: "bg-zinc-100/70",
    borderClass: "border-zinc-300",
    inputPlaceholder: "Identifier un risque, une limite ou un point de vigilance...",
  },
  {
    id: "yellow",
    label: "Chapeau jaune",
    noteBgClass: "bg-amber-100",
    columnBgClass: "bg-amber-50/70",
    borderClass: "border-amber-200",
    inputPlaceholder: "Mettre en avant un bénéfice ou une opportunité...",
  },
  {
    id: "green",
    label: "Chapeau vert",
    noteBgClass: "bg-emerald-100",
    columnBgClass: "bg-emerald-50/70",
    borderClass: "border-emerald-200",
    inputPlaceholder: "Proposer une idée nouvelle ou une alternative créative...",
  },
];

export const BLUE_HAT_CONFIG = {
  id: "blue",
  label: "Chapeau bleu",
  noteBgClass: "bg-sky-100",
  columnBgClass: "bg-sky-50/70",
  borderClass: "border-sky-200",
};

export const HAT_IDS = HAT_CONFIG.map((hat) => hat.id);
const HAT_IDS_SET = new Set(HAT_IDS);

const HAT_BY_ID = HAT_CONFIG.reduce((accumulator, hat) => {
  accumulator[hat.id] = hat;
  return accumulator;
}, {});

export const normalizeHatId = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  return HAT_IDS_SET.has(normalized) ? normalized : "";
};

export const getHatConfigById = (hatId) => {
  const normalizedHatId = normalizeHatId(hatId);
  return normalizedHatId ? HAT_BY_ID[normalizedHatId] : null;
};
