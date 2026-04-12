/**
 * @module workshops/matrices-croisees/data
 * @description Matrices croisées workshop definition and step metadata registry entry.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import matricesImg from "../../../assets/workshops/matrices-croisees.png";

/*
import Step1 from "./steps/Step1.jsx";
import Step2 from "./steps/Step2.jsx";
import Step3 from "./steps/Step3.jsx";
import Step4 from "./steps/Step4.jsx";
import Step5 from "./steps/Step5.jsx";
import Step6 from "./steps/Step6.jsx";
*/

const description1 = [
  "Le facilitateur présente le défi.",
  "Il explique les axes de réflexion (ex : cible, usage, technologie).",
  "👉 L’objectif est de cadrer la problématique."
];

const description2 = [
  "Le groupe construit une matrice à partir des axes définis.",
  "Chaque axe contient plusieurs variables.",
  "👉 Exemple : enfants / adultes / seniors."
];

const description3 = [
  "Les participants combinent les éléments de la matrice.",
  "Chaque combinaison génère une idée.",
  "👉 Objectif : produire un maximum d’idées."
];

const description4 = [
  "Le groupe sélectionne une idée prometteuse.",
  "Critères : impact, faisabilité, originalité.",
  "👉 Le facilitateur veille au timing."
];

const description5 = [
  "L’idée est développée :",
  "- Nom",
  "- Usage",
  "- Bénéfices",
  "- Cible",
  "👉 On transforme l’idée en concept."
];

const description6 = [
  "Chaque groupe présente son idée.",
  "Pitch rapide ou mise en situation.",
  "👉 Objectif : partager et tester les concepts."
];

export const matricesCroisees = {
  id: "matrices-croisees",
  title: "Matrices croisées",
  groupSize: "4 à 8 personnes",
  image: matricesImg,
  benefits: [
    "Stimuler la créativité par la combinaison d’idées",
    "Générer des concepts innovants rapidement",
    "Sortir des schémas de pensée classiques",
    "Favoriser l’intelligence collective",
    "Transformer rapidement des idées en concepts",
  ],
  steps: [
    {
      label: "Définition du cadre",
      duration: 5,
      //component: Step1,
      description: description1,
      audioEnabled: true,
    },
    {
      label: "Construction de la matrice",
      duration: 5,
      //component: Step2,
      description: description2,
      audioEnabled: false,
    },
    {
      label: "Exploration des combinaisons",
      duration: 10,
      //component: Step3,
      description: description3,
      audioEnabled: false,
    },
    {
      label: "Sélection d’une idée",
      duration: 5,
      //component: Step4,
      description: description4,
      audioEnabled: true,
    },
    {
      label: "Développement du concept",
      duration: 10,
      //component: Step5,
      description: description5,
      audioEnabled: true,
    },
    {
      label: "Pitch / restitution",
      duration: 5,
      //component: Step6,
      description: description6,
      audioEnabled: true,
    },
  ],
};