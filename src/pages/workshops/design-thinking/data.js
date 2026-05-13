/**
 * @module workshops/design-thinking/data
 * @description Design Thinking workshop definition and step metadata registry entry.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import designThinkingImg from "../../../assets/workshops/design-thinking.png";
import DraggableNotes from "../../../components/workshops/DraggableNotes.jsx";
import RotatingComments from "../../../components/workshops/RotatingComments.jsx";
import VotingNotes from "../../../components/workshops/VotingNotes.jsx";
import WorkshopChallenge from "../WorkshopChallenge.jsx";
import Step2 from "./steps/Step2.jsx";
import Step3 from "./steps/Step3.jsx";
import Step4 from "./steps/Step4.jsx";
import Step8 from "./steps/Step8.jsx";
import Step9 from "./steps/Step9.jsx";
import Step10 from "./steps/Step10.jsx";

const description1 = [
  { type: "paragraph", text: "Le facilitateur pose une question claire, souvent formulée en « Comment pourrions-nous… ? »" },
  { type: "paragraph", text: "Exemples :" },
  { type: "list", items: ["Comment pourrions-nous améliorer l’expérience des utilisateurs ?", "Comment pourrions-nous réduire les irritants d’un parcours client ?", "Comment pourrions-nous rendre un service plus simple et plus utile ?"] },
  { type: "hint", text: "La question doit être précise mais ouverte." },
];

const description2 = [
  { type: "paragraph", text: "L’équipe se met à la place des utilisateurs." },
  { type: "paragraph", text: "Objectifs : comprendre leurs besoins, frustrations et comportements réels." },
  { type: "paragraph", text: "Méthodes possibles : interviews, observation, immersion terrain." },
  { type: "hint", text: "On cherche à comprendre avant de proposer des solutions." },
];

const description3 = [
  { type: "paragraph", text: "Synthèse des apprentissages de la phase d’empathie." },
  { type: "paragraph", text: "Identification des problèmes clés et des insights." },
  { type: "paragraph", text: "Formulation d’une question claire sous forme de :" },
  { type: "hint", text: "« Comment pourrions-nous… ? »" },
  { type: "paragraph", text: "Exemple : Comment pourrions-nous améliorer l’expérience des utilisateurs ?" },
];

const description4 = [
  { type: "paragraph", text: "Chaque participant note ses idées :" },
  { type: "list", items: ["Une idée par post-it", "Sans discussion, ni autocensure"] },
  { type: "paragraph", text: "Objectifs : éviter l’influence, libérer les introvertis et favoriser l’originalité." },
];

const description5 = [
  { type: "paragraph", text: "Les feuilles circulent entre les participants." },
  { type: "paragraph", text: "Chacun lit, complète, améliore, combine et ajoute des idées." },
  { type: "hint", text: "On construit sur les idées existantes." },
  { type: "paragraph", text: "La richesse collective émerge." },
];

const description6 = [
  { type: "paragraph", text: "Le groupe met les idées en commun :" },
  { type: "list", items: ["Les post-it sont affichés au mur", "Les idées similaires sont regroupées", "Les participants peuvent clarifier certaines propositions"] },
  { type: "hint", text: "L’objectif est d’organiser et comprendre les idées, sans les juger." },
];

const description7 = [
  { type: "paragraph", text: "On utilise ici un vote à gommettes" },
  { type: "paragraph", text: "Objectif : transformer la créativité en innovation exploitable." },
];

const description8 = [
  { type: "paragraph", text: "Transformation des idées en solutions concrètes." },
  { type: "paragraph", text: "Création de maquettes simples : croquis, storyboard, prototype papier." },
  { type: "hint", text: "Le but n’est pas la perfection mais la rapidité." },
  { type: "paragraph", text: "On rend l’idée tangible pour pouvoir la tester." },
];

const description9 = [
  { type: "paragraph", text: "Test des prototypes auprès des utilisateurs." },
  { type: "paragraph", text: "Recueil de feedback :" },
  { type: "list", items: ["Ce qui fonctionne", "Ce qui pose problème", "Ce qui peut être amélioré"] },
  { type: "hint", text: "Objectif : apprendre rapidement et améliorer la solution." },
  { type: "paragraph", text: "Possibilité d’itérer (V1, V2, V3)." },
];

const description10 = [
  { type: "paragraph", text: "Le groupe formalise les apprentissages clés de l’atelier." },
  { type: "paragraph", text: "Objectif : transformer les retours en décision claire et actionnable." },
  { type: "hint", text: "Cette conclusion sert de référence pour la prochaine itération." },
];

/**
 * Design Thinking workshop configuration used by the workshops registry.
 */
const workshop = {
  id: "design-thinking",
  title: "Design Thinking",
  groupSize: "5 à 8 personnes",
  image: designThinkingImg,
  benefits: [
    "Mieux comprendre les besoins réels des utilisateurs.",
    "Éviter de concevoir des solutions déconnectées du terrain.",
    "Favoriser l’intelligence collective et la diversité des points de vue.",
    "Accélérer l’innovation grâce au prototypage rapide.",
    "Réduire les risques en testant tôt les idées.",
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
      label: "Empathie",
      duration: 50,
      component: Step2,
      description: description2,
      audioEnabled: true,
    },
    {
      label: "Définition du problème",
      duration: 5,
      component: Step3,
      description: description3,
      audioEnabled: true,
    },
    {
      label: "Idéation - phase individuelle",
      duration: 5,
      component: Step4,
      description: description4,
      audioEnabled: false,
    },
    {
      label: "Idéation - rotation des feuilles",
      duration: 10,
      component: RotatingComments,
      description: description5,
      challengeField: "problemStatement",
      audioEnabled: false,
    },
    {
      label: "Idéation - mise en commun",
      duration: 15,
      component: DraggableNotes,
      description: description6,
      notesField: "notes",
      setPositionAction: "setNotePosition",
      showComments: true,
      noteClassName: "bg-yellow-100",
      challengeField: "problemStatement",
      audioEnabled: true,
    },
    {
      label: "Idéation - sélection",
      duration: 10,
      component: VotingNotes,
      description: description7,
      notesField: "notes",
      toggleVoteAction: "toggleVote",
      challengeField: "problemStatement",
      audioEnabled: true,
    },
    {
      label: "Prototypage",
      duration: 25,
      component: Step8,
      description: description8,
      audioEnabled: false,
    },
    {
      label: "Test",
      duration: 25,
      component: Step9,
      description: description9,
      audioEnabled: true,
    },
    {
      label: "Conclusion",
      duration: 10,
      component: Step10,
      description: description10,
      audioEnabled: true,
    },
  ],
};

export default workshop;
