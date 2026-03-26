/**
 * @module workshops/design-thinking/data
 * @description Design Thinking workshop definition and step metadata registry entry.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import designThinkingImg from "../../assets/workshops/design-thinking.png";

/*
import Step1 from "./steps/Step1.jsx";
import Step2 from "./steps/Step2.jsx";
import Step3 from "./steps/Step3.jsx";
import Step4 from "./steps/Step4.jsx";
import Step5 from "./steps/Step5.jsx";
*/

const description1 = [
  "L’équipe se met à la place des utilisateurs.",
  "Objectifs : comprendre leurs besoins, frustrations et comportements réels.",
  "Méthodes possibles : interviews, observation, immersion terrain.",
  "👉 On cherche à comprendre avant de proposer des solutions."
];

const description2 = [
  "Synthèse des apprentissages de la phase d’empathie.",
  "Identification des problèmes clés et des insights.",
  "Formulation d’une question claire sous forme de :",
  "👉 « Comment pourrions-nous… ? »",
  "Exemple : Comment pourrions-nous améliorer l’expérience des utilisateurs ?"
];

const description3 = [
  "Génération d’un maximum d’idées.",
  "Règles :",
  "- Une idée par post-it",
  "- Pas de jugement",
  "- Encourager les idées audacieuses",
  "Les idées sont ensuite partagées, enrichies et votées.",
  "👉 Objectif : faire émerger des pistes prometteuses."
];

const description4 = [
  "Transformation des idées en solutions concrètes.",
  "Création de maquettes simples : croquis, storyboard, prototype papier.",
  "👉 Le but n’est pas la perfection mais la rapidité.",
  "On rend l’idée tangible pour pouvoir la tester."
];

const description5 = [
  "Test des prototypes auprès des utilisateurs.",
  "Recueil de feedback :",
  "- Ce qui fonctionne",
  "- Ce qui pose problème",
  "- Ce qui peut être amélioré",
  "👉 Objectif : apprendre rapidement et améliorer la solution.",
  "Possibilité d’itérer (V1, V2, V3)."
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
      label: "Empathie",
      duration: 50,
      // component: Step1,
      description: description1,
      audioEnabled: true,
    },
    {
      label: "Définition du problème",
      duration: 40,
      // component: Step2,
      description: description2,
      audioEnabled: true,
    },
    {
      label: "Idéation",
      duration: 40,
      // component: Step3,
      description: description3,
      audioEnabled: false,
    },
    {
      label: "Prototypage",
      duration: 25,
      // component: Step4,
      description: description4,
      audioEnabled: false,
    },
    {
      label: "Test",
      duration: 25,
      // component: Step5,
      description: description5,
      audioEnabled: true,
    },
  ],
};