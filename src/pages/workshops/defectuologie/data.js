/**
 * @module workshops/defectuologie/data
 * @description Défectuologie workshop definition and step metadata registry entry.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import defectuologieImg from "../../../assets/workshops/defectuologie.png";

import WorkshopChallenge from "../WorkshopChallenge.jsx";
import Step2 from "./steps/Step2.jsx";
import Step3 from "./steps/Step3.jsx";
import Step4 from "./steps/Step4.jsx";
import Step5 from "./steps/Step5.jsx";
import Step6 from "./steps/Step6.jsx";
import Step7 from "./steps/Step7.jsx";

const description1 = [
  { type: "paragraph", text: "Le facilitateur choisit l’objet, le service ou le support à analyser." },
  { type: "paragraph", text: "Le sujet doit être concret et partagé par le groupe." },
  { type: "hint", text: "Objectif : partir d’une base connue par tous." },
];

const description2 = [
  { type: "paragraph", text: "Le groupe liste tous les défauts, limites ou irritants du sujet." },
  { type: "paragraph", text: "Aucune autocensure : tous les problèmes perçus sont utiles." },
  { type: "hint", text: "Objectif : faire émerger les points de friction." },
];

const description3 = [
  { type: "paragraph", text: "Le groupe sélectionne un défaut prioritaire." },
  { type: "paragraph", text: "Ce défaut devient le point de départ du travail créatif." },
  { type: "hint", text: "Objectif : concentrer l’énergie collective sur un vrai problème." },
];

const description4 = [
  { type: "paragraph", text: "Les participants cherchent un maximum de solutions pour résoudre le défaut." },
  { type: "paragraph", text: "Les idées peuvent être simples, ambitieuses ou décalées." },
  { type: "hint", text: "Objectif : entrer en divergence créative." },
];

const description5 = [
  { type: "paragraph", text: "Le groupe retient la solution la plus prometteuse." },
  { type: "paragraph", text: "Critères possibles : impact, utilité, originalité, faisabilité." },
  { type: "hint", text: "Objectif : converger vers une piste forte." },
];

const description6 = [
  { type: "paragraph", text: "La solution choisie est formalisée en concept." },
  { type: "paragraph", text: "Le groupe précise le bénéfice, l’usage et la valeur apportée." },
  { type: "hint", text: "Objectif : transformer une idée en proposition claire." },
];

const description7 = [
  { type: "paragraph", text: "Chaque groupe présente le défaut initial et la solution imaginée." },
  { type: "paragraph", text: "La restitution permet de partager les apprentissages et les concepts." },
  { type: "hint", text: "Objectif : rendre visible la valeur produite." },
];

const workshop = {
  id: "defectuologie",
  title: "Défectuologie",
  groupSize: "4 personnes et +",
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
      component: WorkshopChallenge,
      description: description1,
      audioEnabled: true,
      audioChannel: "general",
    },
    {
      label: "Identification des défauts",
      duration: 10,
      component: Step2,
      description: description2,
      audioEnabled: true,
      audioChannel: "subgroup",
    },
    {
      label: "Sélection d’un défaut",
      duration: 5,
      component: Step3,
      description: description3,
      audioEnabled: true,
      audioChannel: "subgroup",
    },
    {
      label: "Recherche de solutions",
      duration: 10,
      component: Step4,
      description: description4,
      audioEnabled: true,
      audioChannel: "subgroup",
    },
    {
      label: "Choix d’une solution",
      duration: 5,
      component: Step5,
      description: description5,
      audioEnabled: true,
      audioChannel: "subgroup",
    },
    {
      label: "Formalisation du concept",
      duration: 5,
      component: Step6,
      description: description6,
      audioEnabled: true,
      audioChannel: "subgroup",
    },
    {
      label: "Restitution",
      duration: 5,
      component: Step7,
      description: description7,
      audioEnabled: true,
      audioChannel: "general",
    },
  ],
};

export default workshop;
