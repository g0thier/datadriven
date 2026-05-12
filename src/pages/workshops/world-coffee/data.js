/**
 * @module workshops/world-cafe/data
 * @description World Café workshop definition and step metadata registry entry.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import worldCafeImg from "../../../assets/workshops/world-cafe.png";

import Step1 from "./steps/Step1.jsx";
import Step2 from "./steps/Step2.jsx";
import Step3 from "./steps/Step3.jsx";
import Step4 from "./steps/Step4.jsx";
import Step5 from "./steps/Step5.jsx";
import Step6 from "./steps/Step6.jsx";
import Step7 from "./steps/Step7.jsx";

const description1 = [
  { type: "paragraph", text: "Le facilitateur prépare plusieurs tables thématiques." },
  { type: "paragraph", text: "Chaque table correspond à un sujet précis." },
  { type: "hint", text: "Objectif : structurer l’atelier autour de plusieurs conversations parallèles." },
];

const description2 = [
  { type: "paragraph", text: "Un facilitateur fixe est désigné pour chaque table." },
  { type: "paragraph", text: "Il reste à sa place pendant toute la durée de l’atelier." },
  { type: "hint", text: "Objectif : assurer la continuité des échanges à chaque rotation." },
];

const description3 = [
  { type: "paragraph", text: "Un premier groupe rejoint chaque table pour un temps d’échange." },
  { type: "paragraph", text: "Les participants notent leurs idées directement sur la nappe ou le paperboard." },
  { type: "hint", text: "En fin de séquence, le groupe retient 3 idées clés." },
];

const description4 = [
  { type: "paragraph", text: "Les groupes tournent vers une nouvelle table." },
  { type: "paragraph", text: "Le facilitateur rappelle le thème et les idées déjà produites." },
  { type: "hint", text: "Le nouveau groupe enrichit les premières pistes." },
];

const description5 = [
  { type: "paragraph", text: "Une nouvelle rotation permet d’approfondir encore les idées." },
  { type: "paragraph", text: "Le groupe détaille les propositions et commence à les rendre plus opérationnelles." },
  { type: "hint", text: "Objectif : passer d’idées générales à des pistes d’action." },
];

const description6 = [
  { type: "paragraph", text: "Les groupes reviennent à leur table d’origine." },
  { type: "paragraph", text: "Ils découvrent comment les idées ont évolué au fil des rotations." },
  { type: "hint", text: "Objectif : synthétiser le travail collectif." },
];

const description7 = [
  { type: "paragraph", text: "Chaque table restitue ses idées et ses pistes d’action en plénière." },
  { type: "paragraph", text: "Le groupe partage les enseignements produits pendant l’atelier." },
  { type: "hint", text: "Objectif : mettre en commun l’intelligence collective." },
];

const workshop = {
  id: "world-cafe",
  title: "World Café",
  groupSize: "35 à 50 personnes",
  image: worldCafeImg,
  benefits: [
    "Faire travailler efficacement de grands groupes",
    "Favoriser l’intelligence collective",
    "Enrichir progressivement les idées grâce aux rotations",
    "Croiser les points de vue sur plusieurs thèmes",
    "Transformer les échanges en pistes d’action concrètes",
  ],
  steps: [
    {
      label: "Préparation des tables",
      duration: 10,
      component: Step1,
      description: description1,
      audioEnabled: true,
    },
    {
      label: "Installation des facilitateurs",
      duration: 5,
      component: Step2,
      description: description2,
      audioEnabled: true,
    },
    {
      label: "Premier round",
      duration: 20,
      component: Step3,
      description: description3,
      audioEnabled: true,
      audioChannel: "subgroup",
    },
    {
      label: "Première rotation",
      duration: 20,
      component: Step4,
      description: description4,
      audioEnabled: true,
      audioChannel: "subgroup",
    },
    {
      label: "Deuxième rotation",
      duration: 20,
      component: Step5,
      description: description5,
      audioEnabled: true,
      audioChannel: "subgroup",
    },
    {
      label: "Retour et synthèse",
      duration: 10,
      component: Step6,
      description: description6,
      audioEnabled: true,
      audioChannel: "subgroup",
    },
    {
      label: "Restitution collective",
      duration: 10,
      component: Step7,
      description: description7,
      audioEnabled: true,
      audioChannel: "general",
    },
  ],
};

export default workshop;
