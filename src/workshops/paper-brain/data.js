/**
 * @module workshops/paper-brain/data
 * @description Paper Brain workshop definition and step metadata registry entry.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import paperBrainImg from "../../assets/workshops/paper-brain.png";

import Step1 from "./steps/Step1.jsx";
import Step2 from "./steps/Step2.jsx";
import Step3 from "./steps/Step3.jsx";
import Step4 from "./steps/Step4.jsx";
import Step5 from "./steps/Step5.jsx";

const description1 = [
    "Le facilitateur pose une question claire, souvent formulée en « Comment pourrions-nous… ? »",
    "Exemples :",
    "- Comment pourrions-nous améliorer l’expérience des télétravailleurs ?",
    "- Comment pourrions-nous réduire les irritants d’un parcours client ?",
    "- Comment pourrions-nous inventer un produit antistress pour cadres en burn-out ?",
    "👉 La question doit être précise mais ouverte."
];

const description2 = [
    "Chaque participant note ses idées :",
    "- Une idée par post-it",
    "- Sans discussion, ni autocensure",
    "Objectifs : éviter l’influence, libérer les introvertis et favoriser l’originalité."
];

const description3 = [
    "Les feuilles circulent entre les participants.",
    "Chacun lit, complète, améliore, combine et ajoute des idées.",
    "👉 On construit sur les idées existantes.",
    "La richesse collective émerge."
];

const description4 = [
    "Le groupe met les idées en commun :",
    "- Les post-it sont affichés au mur",
    "- Les idées similaires sont regroupées",
    "- Les participants peuvent clarifier certaines propositions",
    "👉 L’objectif est d’organiser et comprendre les idées, sans les juger."
];

const description5 = [
    "On utilise ici un vote à gommettes",
    "Objectif : transformer la créativité en innovation exploitable."
];

/**
 * Paper Brain workshop configuration used by the workshops registry.
 *
 * @type {Object}
 * @example
 * import { paperBrain } from "./paper-brain/data.js";
 *
 * // Real usage references:
 * // - src/workshops/index.js (WORKSHOPS["paper-brain"])
 * // - src/workshops/paper-brain/data.js (steps use Step1..Step5 components)
 * const stepComponent = paperBrain.steps[0].component;
 */
export const paperBrain = {
  id: "paper-brain",
  title: "Paper Brain",
  groupSize: "3 à 8 personnes",
  image: paperBrainImg,
  benefits: [
    "Générer beaucoup dʼidées en peu de temps.",
    "Éviter que certaines personnes monopolisent la parole",
    "Favoriser lʼintelligence collective",
    "Produire des idées variées et parfois inattendues",
  ],
  steps: [
    {
      label: "Définition du défi",
      duration: 5,
      component: Step1,
      description: description1,
      audioEnabled: true,
    },
    {
      label: "Phase individuelle",
      duration: 5,
      component: Step2,
      description: description2,
      audioEnabled: false,
    },
    {
      label: "Rotation des feuilles",
      duration: 10,
      component: Step3,
      description: description3,
      audioEnabled: false,
    },
    {
      label: "Mise en commun",
      duration: 15,
      component: Step4,
      description: description4,
      audioEnabled: true,
    },
    {
      label: "Sélection / priorisation",
      duration: 10,
      component: Step5,
      description: description5,
      audioEnabled: true,
    },
  ],
};
