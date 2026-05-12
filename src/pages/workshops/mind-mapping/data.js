/**
 * @module workshops/mind-mapping/data
 * @description Mind Mapping workshop definition and step metadata registry entry.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import mindMappingImg from "../../../assets/workshops/mind-mapping.png";

import Step1 from "./steps/Step1.jsx";
import Step2 from "./steps/Step2.jsx";
import Step3 from "./steps/Step3.jsx";
import Step4 from "./steps/Step4.jsx";
import Step5 from "./steps/Step5.jsx";
import Step6 from "./steps/Step6.jsx";

const description1 = [
  { type: "paragraph", text: "Le facilitateur définit le sujet central." },
  { type: "paragraph", text: "Il est placé au centre de la feuille ou du tableau." },
  { type: "hint", text: "Exemple : un produit, un service ou un problème à résoudre." },
];

const description2 = [
  { type: "paragraph", text: "Le groupe identifie les grandes catégories liées au sujet." },
  { type: "paragraph", text: "Ces catégories deviennent les branches principales." },
  { type: "hint", text: "Exemple : usages, cibles, caractéristiques." },
];

const description3 = [
  { type: "paragraph", text: "Chaque branche est développée en sous-branches." },
  { type: "paragraph", text: "On ajoute des idées, des fonctionnalités ou des variantes." },
  { type: "hint", text: "Objectif : enrichir la réflexion." },
];

const description4 = [
  { type: "paragraph", text: "Le groupe explore des pistes créatives." },
  { type: "paragraph", text: "On cherche des associations, des idées originales ou inattendues." },
  { type: "hint", text: "Objectif : générer de nouvelles opportunités." },
];

const description5 = [
  { type: "paragraph", text: "Le groupe sélectionne les idées les plus pertinentes." },
  { type: "paragraph", text: "Critères : impact, faisabilité, originalité." },
  { type: "hint", text: "Objectif : converger vers une piste forte." },
];

const description6 = [
  { type: "paragraph", text: "La carte mentale est synthétisée." },
  { type: "paragraph", text: "On transforme les idées en concept structuré." },
  { type: "hint", text: "Objectif : passer à une solution exploitable." },
];

export const mindMapping = {
  id: "mind-mapping",
  title: "Mind Mapping",
  groupSize: "3 à 8 personnes",
  image: mindMappingImg,
  benefits: [
    "Structurer visuellement un problème complexe",
    "Stimuler la créativité par association d’idées",
    "Explorer rapidement plusieurs pistes",
    "Favoriser l’intelligence collective",
    "Transformer des idées en concepts concrets",
  ],
  steps: [
    {
      label: "Définition du sujet",
      duration: 5,
      component: Step1,
      description: description1,
      audioEnabled: true,
    },
    {
      label: "Branches principales",
      duration: 5,
      component: Step2,
      description: description2,
      audioEnabled: false,
    },
    {
      label: "Développement des idées",
      duration: 10,
      component: Step3,
      description: description3,
      audioEnabled: false,
    },
    {
      label: "Exploration créative",
      duration: 10,
      component: Step4,
      description: description4,
      audioEnabled: false,
    },
    {
      label: "Sélection des concepts",
      duration: 5,
      component: Step5,
      description: description5,
      audioEnabled: true,
    },
    {
      label: "Synthèse",
      duration: 5,
      component: Step6,
      description: description6,
      audioEnabled: true,
    },
  ],
};
