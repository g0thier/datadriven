/**
 * @module workshops/design-thinking/data
 * @description Design Thinking workshop definition and step metadata registry entry.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import designThinkingImg from "../../../assets/workshops/design-thinking.png";
import Step1 from "./steps/Step1.jsx";
import Step2 from "./steps/Step2.jsx";
import Step3 from "./steps/Step3.jsx";
import Step4 from "./steps/Step4.jsx";
import Step5 from "./steps/Step5.jsx";
import Step6 from "./steps/Step6.jsx";
import Step7 from "./steps/Step7.jsx";
import Step8 from "./steps/Step8.jsx";
import Step9 from "./steps/Step9.jsx";
import Step10 from "./steps/Step10.jsx";

const description1 = [
  "Le facilitateur pose une question claire, souvent formulée en « Comment pourrions-nous… ? »",
  "Exemples :",
  "- Comment pourrions-nous améliorer l’expérience des utilisateurs ?",
  "- Comment pourrions-nous réduire les irritants d’un parcours client ?",
  "- Comment pourrions-nous rendre un service plus simple et plus utile ?",
  "👉 La question doit être précise mais ouverte."
];

const description2 = [
  "L’équipe se met à la place des utilisateurs.",
  "Objectifs : comprendre leurs besoins, frustrations et comportements réels.",
  "Méthodes possibles : interviews, observation, immersion terrain.",
  "👉 On cherche à comprendre avant de proposer des solutions."
];

const description3 = [
  "Synthèse des apprentissages de la phase d’empathie.",
  "Identification des problèmes clés et des insights.",
  "Formulation d’une question claire sous forme de :",
  "👉 « Comment pourrions-nous… ? »",
  "Exemple : Comment pourrions-nous améliorer l’expérience des utilisateurs ?"
];

const description4 = [
  "Chaque participant note ses idées :",
  "- Une idée par post-it",
  "- Sans discussion, ni autocensure",
  "Objectifs : éviter l’influence, libérer les introvertis et favoriser l’originalité."
];

const description5 = [
  "Les feuilles circulent entre les participants.",
  "Chacun lit, complète, améliore, combine et ajoute des idées.",
  "👉 On construit sur les idées existantes.",
  "La richesse collective émerge."
];

const description6 = [
  "Le groupe met les idées en commun :",
  "- Les post-it sont affichés au mur",
  "- Les idées similaires sont regroupées",
  "- Les participants peuvent clarifier certaines propositions",
  "👉 L’objectif est d’organiser et comprendre les idées, sans les juger."
];

const description7 = [
  "On utilise ici un vote à gommettes",
  "Objectif : transformer la créativité en innovation exploitable."
];

const description8 = [
  "Transformation des idées en solutions concrètes.",
  "Création de maquettes simples : croquis, storyboard, prototype papier.",
  "👉 Le but n’est pas la perfection mais la rapidité.",
  "On rend l’idée tangible pour pouvoir la tester."
];

const description9 = [
  "Test des prototypes auprès des utilisateurs.",
  "Recueil de feedback :",
  "- Ce qui fonctionne",
  "- Ce qui pose problème",
  "- Ce qui peut être amélioré",
  "👉 Objectif : apprendre rapidement et améliorer la solution.",
  "Possibilité d’itérer (V1, V2, V3)."
];

const description10 = [
  "Le groupe formalise les apprentissages clés de l’atelier.",
  "Objectif : transformer les retours en décision claire et actionnable.",
  "👉 Cette conclusion sert de référence pour la prochaine itération."
];

/**
 * Design Thinking workshop configuration used by the workshops registry.
 */
export const designThinking = {
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
      component: Step1,
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
      component: Step5,
      description: description5,
      audioEnabled: false,
    },
    {
      label: "Idéation - mise en commun",
      duration: 15,
      component: Step6,
      description: description6,
      audioEnabled: true,
    },
    {
      label: "Idéation - sélection",
      duration: 10000000000000000000,
      component: Step7,
      description: description7,
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
