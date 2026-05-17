/**
 * @module workshops/speed-boat/data
 * @description Speed Boat workshop definition and step metadata registry entry.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import speedBoatImg from "../../../assets/workshops/speed-boat.png";
import speedBoatBoatImg from "../../../assets/workshops/speed-boat/speed-boat-boat.png";
import DraggableNotes from "../../../components/workshops/DraggableNotes.jsx";
import WorkshopChallenge from "../WorkshopChallenge.jsx";
import Step2 from "./steps/Step2.jsx";
import Step3 from "./steps/Step3.jsx";
import Step5 from "./steps/Step5.jsx";
import Step7 from "./steps/Step7.jsx";
import Step8 from "./steps/Step8.jsx";

const description1 = [
  { type: "paragraph", text: "Le facilitateur présente le défi et le support visuel du bateau." },
  { type: "paragraph", text: "Le bateau représente l’équipe, le projet ou l’organisation." },
  { type: "hint", text: "L’objectif est de poser un cadre simple et visuel." },
];

const description2 = [
  { type: "paragraph", text: "Le groupe définit la destination du bateau." },
  { type: "paragraph", text: "L’île représente l’objectif à atteindre ou la situation souhaitée." },
  { type: "hint", text: "Objectif : aligner les participants sur la cible." },
];

const description3 = [
  { type: "paragraph", text: "Chaque participant identifie les freins qui ralentissent le bateau." },
  { type: "paragraph", text: "Une idée par note : contraintes, irritants, peurs, obstacles." },
  { type: "hint", text: "Objectif : faire émerger les ancres du projet." },
];

const description4 = [
  { type: "paragraph", text: "Le groupe met en commun les freins identifiés." },
  { type: "paragraph", text: "Les notes sont regroupées par grandes catégories." },
  { type: "hint", text: "Objectif : clarifier les principaux blocages." },
];

const description5 = [
  { type: "paragraph", text: "Le groupe identifie aussi les leviers qui peuvent faire avancer le bateau." },
  { type: "paragraph", text: "On cherche les ressources, les atouts et les appuis disponibles." },
  { type: "hint", text: "Objectif : équilibrer le diagnostic entre freins et moteurs." },
];

const description6 = [
  { type: "paragraph", text: "Le groupe met en commun les leviers identifiés." },
  { type: "paragraph", text: "Les notes sont regroupées par grandes catégories." },
  { type: "hint", text: "Objectif : clarifier les principaux moteurs d’action." },
];

const description7 = [
  { type: "paragraph", text: "Le groupe priorise les freins à traiter." },
  { type: "paragraph", text: "Les participants sélectionnent les ancres les plus critiques." },
  { type: "hint", text: "Objectif : concentrer l’énergie sur les vrais sujets." },
];

const description8 = [
  { type: "paragraph", text: "Le groupe transforme les freins prioritaires en actions concrètes." },
  { type: "paragraph", text: "Il précise les premières actions, décisions ou étapes à lancer." },
  { type: "hint", text: "Objectif : passer du constat au plan d’action." },
];

const workshop = {
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
      component: WorkshopChallenge,
      description: description1,
      challengeFooterImage: speedBoatBoatImg,
      challengeFooterAlt: "Support visuel Speed Boat",
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
      duration: 5,
      component: Step3,
      description: description3,
      audioEnabled: false,
    },
    {
      label: "Mise en commun des freins",
      duration: 10,
      component: DraggableNotes,
      description: description4,
      notesField: "brakeNotes",
      setPositionAction: "setBrakeNotePosition",
      showComments: false,
      noteClassName: "bg-red-100",
      notesCountLabel: "freins",
      showObjectiveCard: true,
      audioEnabled: true,
    },
    {
      label: "Identification des leviers",
      duration: 5,
      component: Step5,
      description: description5,
      audioEnabled: false,
    },
    {
      label: "Mise en commun des leviers",
      duration: 10,
      component: DraggableNotes,
      description: description6,
      notesField: "leverNotes",
      setPositionAction: "setLeverNotePosition",
      showComments: false,
      noteClassName: "bg-blue-100",
      notesCountLabel: "leviers",
      showObjectiveCard: true,
      audioEnabled: true,
    },
    {
      label: "Priorisation",
      duration: 5,
      component: Step7,
      description: description7,
      audioEnabled: true,
    },
    {
      label: "Plan d’action",
      duration: 10,
      component: Step8,
      description: description8,
      audioEnabled: true,
    },
  ],
};

export default workshop;
