/**
 * @module workshops/six-hats/data
 * @description Six chapeaux de Bono workshop definition and step metadata registry entry.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import sixHatsImg from "../../../assets/workshops/six-hats.png";

import Step1 from "./steps/Step1.jsx";
import Step2 from "./steps/Step2.jsx";
import Step3 from "./steps/Step3.jsx";
import Step4 from "./steps/Step4.jsx";
import Step5 from "./steps/Step5.jsx";
import Step6 from "./steps/Step6.jsx";
import Step7 from "./steps/Step7.jsx";

const description1 = [
  { type: "paragraph", text: "Le facilitateur présente le sujet ou le problème à traiter." },
  { type: "paragraph", text: "Il explique les règles de la méthode des six chapeaux." },
  { type: "hint", text: "Le groupe comprend qu’il faut explorer une seule posture de réflexion à la fois." },
];

const description2 = [
  { type: "paragraph", text: "Le groupe adopte le chapeau blanc." },
  { type: "paragraph", text: "On partage les faits, les données disponibles et les informations manquantes." },
  { type: "hint", text: "Objectif : partir d’une base factuelle." },
];

const description3 = [
  { type: "paragraph", text: "Le groupe adopte le chapeau rouge." },
  { type: "paragraph", text: "Chacun exprime librement ses ressentis, intuitions ou perceptions." },
  { type: "hint", text: "Objectif : faire émerger la dimension émotionnelle du sujet." },
];

const description4 = [
  { type: "paragraph", text: "Le groupe adopte le chapeau noir." },
  { type: "paragraph", text: "On identifie les risques, les limites, les objections et les points de vigilance." },
  { type: "hint", text: "Objectif : tester la robustesse des idées." },
];

const description5 = [
  { type: "paragraph", text: "Le groupe adopte le chapeau jaune." },
  { type: "paragraph", text: "On met en avant les bénéfices, les opportunités et les éléments positifs." },
  { type: "hint", text: "Objectif : révéler le potentiel de la proposition." },
];

const description6 = [
  { type: "paragraph", text: "Le groupe adopte le chapeau vert." },
  { type: "paragraph", text: "On cherche des idées nouvelles, des alternatives et des pistes créatives." },
  { type: "hint", text: "Objectif : ouvrir largement le champ des possibles." },
];

const description7 = [
  { type: "paragraph", text: "Le groupe adopte le chapeau bleu." },
  { type: "paragraph", text: "Le facilitateur synthétise les échanges et organise la suite." },
  { type: "hint", text: "Objectif : conclure, décider et aligner le groupe." },
];

export const sixChapeauxBono = {
  id: "six-chapeaux-bono",
  title: "Six chapeaux de Bono",
  groupSize: "6 à 10 personnes",
  image: sixHatsImg,
  benefits: [
    "Structurer la réflexion collective",
    "Éviter les débats stériles et les conflits d’ego",
    "Faire participer tous les profils du groupe",
    "Explorer un sujet sous plusieurs angles",
    "Faciliter la prise de décision",
  ],
  steps: [
    {
      label: "Introduction du sujet",
      duration: 5,
      component: Step1,
      description: description1,
      audioEnabled: true,
    },
    {
      label: "Chapeau blanc",
      duration: 5,
      component: Step2,
      description: description2,
      audioEnabled: false,
    },
    {
      label: "Chapeau rouge",
      duration: 5,
      component: Step3,
      description: description3,
      audioEnabled: false,
    },
    {
      label: "Chapeau noir",
      duration: 5,
      component: Step4,
      description: description4,
      audioEnabled: true,
    },
    {
      label: "Chapeau jaune",
      duration: 5,
      component: Step5,
      description: description5,
      audioEnabled: true,
    },
    {
      label: "Chapeau vert",
      duration: 5,
      component: Step6,
      description: description6,
      audioEnabled: false,
    },
    {
      label: "Chapeau bleu",
      duration: 5,
      component: Step7,
      description: description7,
      audioEnabled: true,
    },
  ],
};
