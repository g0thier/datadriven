/**
 * @module workshops/paper-brain/data
 * @description Paper Brain workshop definition and step metadata registry entry.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import paperBrainImg from "../../../assets/workshops/paper-brain.png";
import DraggableNotes from "../../../components/workshops/DraggableNotes.jsx";
import RotatingComments from "../../../components/workshops/RotatingComments.jsx";
import VotingNotes from "../../../components/workshops/VotingNotes.jsx";

import WorkshopChallenge from "../WorkshopChallenge.jsx";
import Step2 from "./steps/Step2.jsx";

const description1 = [
  { type: "paragraph", text: "Le facilitateur pose une question claire, souvent formulée en « Comment pourrions-nous… ? »" },
  { type: "paragraph", text: "Exemples :" },
  { type: "list", items: ["Comment pourrions-nous améliorer l’expérience des télétravailleurs ?", "Comment pourrions-nous réduire les irritants d’un parcours client ?", "Comment pourrions-nous inventer un produit antistress pour cadres en burn-out ?"] },
  { type: "hint", text: "La question doit être précise mais ouverte." },
];

const description2 = [
  { type: "paragraph", text: "Chaque participant note ses idées :" },
  { type: "list", items: ["Une idée par post-it", "Sans discussion, ni autocensure"] },
  { type: "hint", text: "Objectifs : éviter l’influence, libérer les introvertis et favoriser l’originalité." },
];

const description3 = [
  { type: "paragraph", text: "Les feuilles circulent entre les participants." },
  { type: "paragraph", text: "Chacun lit, complète, améliore, combine et ajoute des idées." },
  { type: "hint", text: "On construit sur les idées existantes." },
  { type: "paragraph", text: "La richesse collective émerge." },
];

const description4 = [
  { type: "paragraph", text: "Le groupe met les idées en commun :" },
  { type: "list", items: ["Les post-it sont affichés au mur", "Les idées similaires sont regroupées", "Les participants peuvent clarifier certaines propositions"] },
  { type: "hint", text: "L’objectif est d’organiser et comprendre les idées, sans les juger." },
];

const description5 = [
  { type: "paragraph", text: "On utilise ici un vote à gommettes" },
  { type: "paragraph", text: "Objectif : transformer la créativité en innovation exploitable." },
];

/**
 * Paper Brain workshop configuration used by the workshops registry.
 *
 * @type {Object}
 * @example
 * import paperBrain from "./paper-brain/data.js";
 *
 * // Real usage references:
 * // - src/pages/workshops/index.js (WORKSHOPS["paper-brain"])
 * // - src/pages/workshops/paper-brain/data.js (steps use Step1..Step5 components)
 * const stepComponent = paperBrain.steps[0].component;
 */
const workshop = {
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
      component: WorkshopChallenge,
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
      component: RotatingComments,
      description: description3,
      audioEnabled: false,
    },
    {
      label: "Mise en commun",
      duration: 15,
      component: DraggableNotes,
      description: description4,
      notesField: "notes",
      setPositionAction: "setNotePosition",
      showComments: true,
      noteClassName: "bg-yellow-100",
      audioEnabled: true,
    },
    {
      label: "Sélection / priorisation",
      duration: 10,
      component: VotingNotes,
      description: description5,
      notesField: "notes",
      toggleVoteAction: "toggleVote",
      audioEnabled: true,
    },
  ],
};

export default workshop;
