/**
 * @module workshops/defectuologie/data
 * @description Défectuologie workshop definition and step metadata registry entry.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import defectuologieImg from "../../../assets/workshops/defectuologie.png";

/*
import Step1 from "./steps/Step1.jsx";
import Step2 from "./steps/Step2.jsx";
import Step3 from "./steps/Step3.jsx";
import Step4 from "./steps/Step4.jsx";
import Step5 from "./steps/Step5.jsx";
import Step6 from "./steps/Step6.jsx";
import Step7 from "./steps/Step7.jsx";
*/

const description1 = [
  "Le facilitateur choisit l’objet, le service ou le support à analyser.",
  "Le sujet doit être concret et partagé par le groupe.",
  "👉 Objectif : partir d’une base connue par tous."
];

const description2 = [
  "Le groupe liste tous les défauts, limites ou irritants du sujet.",
  "Aucune autocensure : tous les problèmes perçus sont utiles.",
  "👉 Objectif : faire émerger les points de friction."
];

const description3 = [
  "Le groupe sélectionne un défaut prioritaire.",
  "Ce défaut devient le point de départ du travail créatif.",
  "👉 Objectif : concentrer l’énergie collective sur un vrai problème."
];

const description4 = [
  "Les participants cherchent un maximum de solutions pour résoudre le défaut.",
  "Les idées peuvent être simples, ambitieuses ou décalées.",
  "👉 Objectif : entrer en divergence créative."
];

const description5 = [
  "Le groupe retient la solution la plus prometteuse.",
  "Critères possibles : impact, utilité, originalité, faisabilité.",
  "👉 Objectif : converger vers une piste forte."
];

const description6 = [
  "La solution choisie est formalisée en concept.",
  "Le groupe précise le bénéfice, l’usage et la valeur apportée.",
  "👉 Objectif : transformer une idée en proposition claire."
];

const description7 = [
  "Chaque groupe présente le défaut initial et la solution imaginée.",
  "La restitution permet de partager les apprentissages et les concepts.",
  "👉 Objectif : rendre visible la valeur produite."
];

export const defectuologie = {
  id: "defectuologie",
  title: "Défectuologie",
  groupSize: "4 à 8 personnes",
  image: defectuologieImg,
  benefits: [
    "Partir de problèmes concrets pour stimuler l’innovation",
    "Faciliter l’entrée en créativité",
    "Identifier des irritants réels et utiles",
    "Faire émerger des solutions concrètes rapidement",
    "Améliorer des produits, services ou outils existants",
  ],
  steps: [
    {
      label: "Choix du sujet",
      duration: 5,
      // component: Step1,
      description: description1,
      audioEnabled: true,
    },
    {
      label: "Identification des défauts",
      duration: 10,
      // component: Step2,
      description: description2,
      audioEnabled: false,
    },
    {
      label: "Sélection d’un défaut",
      duration: 5,
      // component: Step3,
      description: description3,
      audioEnabled: true,
    },
    {
      label: "Recherche de solutions",
      duration: 10,
      // component: Step4,
      description: description4,
      audioEnabled: false,
    },
    {
      label: "Choix d’une solution",
      duration: 5,
      // component: Step5,
      description: description5,
      audioEnabled: true,
    },
    {
      label: "Formalisation du concept",
      duration: 5,
      // component: Step6,
      description: description6,
      audioEnabled: true,
    },
    {
      label: "Restitution",
      duration: 5,
      // component: Step7,
      description: description7,
      audioEnabled: true,
    },
  ],
};