/**
 * @module workshops/speed-boat/data
 * @description Speed Boat workshop definition and step metadata registry entry.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import speedBoatImg from "../../../assets/workshops/speed-boat.png";
import Step1 from "./steps/Step1.jsx";
import Step2 from "./steps/Step2.jsx";
import Step3 from "./steps/Step3.jsx";
import Step4 from "./steps/Step4.jsx";
import Step5 from "./steps/Step5.jsx";

/*
import Step6 from "./steps/Step6.jsx";
import Step7 from "./steps/Step7.jsx";
*/

const description1 = [
  "Le facilitateur présente le défi et le support visuel du bateau.",
  "Le bateau représente l’équipe, le projet ou l’organisation.",
  "👉 L’objectif est de poser un cadre simple et visuel."
];

const description2 = [
  "Le groupe définit la destination du bateau.",
  "L’île représente l’objectif à atteindre ou la situation souhaitée.",
  "👉 Objectif : aligner les participants sur la cible."
];

const description3 = [
  "Chaque participant identifie les freins qui ralentissent le bateau.",
  "Une idée par post-it : contraintes, irritants, peurs, obstacles.",
  "👉 Objectif : faire émerger les ancres du projet."
];

const description4 = [
  "Le groupe met en commun les freins identifiés.",
  "Les post-it sont regroupés par grandes catégories.",
  "👉 Objectif : clarifier les principaux blocages."
];

const description5 = [
  "Le groupe identifie aussi les leviers qui peuvent faire avancer le bateau.",
  "On cherche les ressources, les atouts et les appuis disponibles.",
  "👉 Objectif : équilibrer le diagnostic entre freins et moteurs."
];

const description6 = [
  "Le groupe priorise les freins à traiter.",
  "Les participants sélectionnent les ancres les plus critiques.",
  "👉 Objectif : concentrer l’énergie sur les vrais sujets."
];

const description7 = [
  "Le groupe transforme les freins prioritaires en actions concrètes.",
  "Il précise les premières décisions ou étapes à lancer.",
  "👉 Objectif : passer du constat au plan d’action."
];

export const speedBoat = {
  id: "speed-boat",
  title: "Speed Boat",
  groupSize: "5 à 10 personnes",
  image: speedBoatImg,
  benefits: [
    "Visualiser simplement une situation complexe",
    "Faire émerger les freins réels d’un projet ou d’une équipe",
    "Faciliter la parole collective sur les blocages",
    "Prioriser les obstacles les plus critiques",
    "Transformer le diagnostic en actions concrètes",
  ],
  steps: [
    {
      label: "Introduction du défi",
      duration: 5,
      component: Step1,
      description: description1,
      audioEnabled: true,
    },
    {
      label: "Définition de la destination",
      duration: 5,
      component: Step2,
      description: description2,
      audioEnabled: true,
    },
    {
      label: "Identification des freins",
      duration: 10,
      component: Step3,
      description: description3,
      audioEnabled: false,
    },
    {
      label: "Mise en commun",
      duration: 10,
      component: Step4,
      description: description4,
      audioEnabled: true,
    },
    {
      label: "Identification des leviers",
      duration: 10,
      component: Step5,
      description: description5,
      audioEnabled: false,
    },
    {
      label: "Priorisation",
      duration: 5,
      //component: Step6,
      description: description6,
      audioEnabled: true,
    },
    {
      label: "Plan d’action",
      duration: 10,
      //component: Step7,
      description: description7,
      audioEnabled: true,
    },
  ],
};
