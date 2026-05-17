/**
 * @module workshops/continue-arrete-tente/data
 * @description On continue / On arrête / On tente workshop definition and step metadata registry entry.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import continueArreteTenteImg from "../../../assets/workshops/continue-arrete-tente.png";

import WorkshopChallenge from "../WorkshopChallenge.jsx";
import Step2 from "./steps/Step2.jsx";
import Step3 from "./steps/Step3.jsx";
import Step4 from "./steps/Step4.jsx";
import Step5 from "./steps/Step5.jsx";

const description1 = [
  { type: "paragraph", text: "Le facilitateur précise le périmètre : projet, équipe, rituel ou période concernée." },
  { type: "paragraph", text: "Trois colonnes sont préparées : on continue, on arrête, on tente." },
  { type: "hint", text: "Plus le périmètre est clair, plus les contributions seront utiles." },
];

const description2 = [
  { type: "paragraph", text: "Chaque participant note ses idées dans les trois colonnes." },
  { type: "list", items: ["Une idée par note", "Sans discussion, ni autocensure"] },
  { type: "paragraph", text: "Objectifs : éviter l’influence, libérer les introvertis et favoriser l’originalité." },
];

const description3 = [
  { type: "paragraph", text: "Le groupe met les idées en commun :" },
  { type: "list", items: ["Les notes sont affichées au mur", "Les idées similaires sont regroupées", "Les participants peuvent clarifier certaines propositions"] },
  { type: "hint", text: "L’objectif est d’organiser et comprendre les idées, sans les juger." },
];

const description4 = [
  { type: "paragraph", text: "Les participants votent pour retenir les éléments les plus importants de chaque colonne." },
  { type: "paragraph", text: "On garde quelques priorités maximum pour rester réaliste." },
  { type: "hint", text: "La simplicité fait la force de l’outil." },
];

const description5 = [
  { type: "paragraph", text: "Le groupe transforme les choix en engagements : ce qu’on maintient, ce qu’on stoppe, ce qu’on expérimente." },
  { type: "paragraph", text: "On peut associer un responsable et une échéance à chaque point retenu." },
  { type: "hint", text: "L’atelier devient utile quand il produit une suite visible." },
];

const workshop = {
  id: "continue-arrete-tente",
  title: "On continue, arrête, tente",
  groupSize: "3 à 12 personnes",
  image: continueArreteTenteImg,
  benefits: [
    "Faire un retour d’expérience très lisible.",
    "Identifier rapidement les pratiques à conserver, stopper ou tester.",
    "Favoriser un échange simple, direct et constructif.",
    "Aider une équipe à passer du constat à l’engagement.",
  ],
  steps: [
    {
      label: "Cadrage de la rétrospective",
      duration: 5,
      component: WorkshopChallenge,
      description: description1,
      audioEnabled: true,
    },
    {
      label: "Réflexion individuelle",
      duration: 8,
      component: Step2,
      description: description2,
      audioEnabled: false,
    },
    {
      label: "Partage collectif",
      duration: 10,
      component: Step3,
      description: description3,
      audioEnabled: true,
    },
    {
      label: "Choix des priorités",
      duration: 10,
      component: Step4,
      description: description4,
      audioEnabled: true,
    },
    {
      label: "Engagement d’équipe",
      duration: 7,
      component: Step5,
      description: description5,
      audioEnabled: true,
    }
  ],
};

export default workshop;
