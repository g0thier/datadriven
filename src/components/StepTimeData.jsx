import paperBrain from '../pages/innovation/assets/paper-brain.png'

export const data = {
    title: 'Paper Brain',
    groupSize: 'à partir de 3 personnes',
    image: paperBrain,
    benefits: [
      'Générer beaucoup dʼidées en peu de temps.',
      'Éviter que certaines personnes monopolisent la parole',
      'Favoriser lʼintelligence collective',
      'Produire des idées variées et parfois inattendues'
    ],
    steps: [
      { label: 'Définition du défi',
        duration : 5,
        page : './pages/innovation/paper-brain/Step1.jsx',
        description: [
          "Le facilitateur pose une question claire, souvent formulée en **“Comment pourrions-nous… ?”**", 
          "Exemples :",
          "* Comment pourrions-nous améliorer l’expérience des télétravailleurs ?",
          "* Comment pourrions-nous réduire les irritants d’un parcours client ?",
          "* Comment pourrions-nous inventer un produit antistress pour cadres en burn-out ?",
          "👉 La question doit être précise mais ouverte."
        ],
      },
      {
        label: 'Phase individuelle',
        duration: 10,
        page : './pages/innovation/paper-brain/Step2.jsx',
        description: [
          "Chaque participant :",
          "* Écrit ses idées sur une feuille",
          "* Une idée par ligne (ou par post-it)",
          "* En silence",
          "* Sans autocensure",
          "* Sans discussion",
          "C’est la différence clé avec le brainstorming classique :",
          "🧠 On réfléchit d’abord seul.",
          "Pourquoi ?",
          "* Évite l’influence des autres",
          "* Stimule les profils introvertis",
          "* Permet des idées plus originales"
        ],
      },
      {
        label: 'Rotation des feuilles',
        duration: 10,
        page : './pages/innovation/paper-brain/Step3.jsx',
        description: [
          "Les feuilles circulent entre les participants.",
          "Chacun :",
          "* Lit les idées des autres",
          "* Complète",
          "* Améliore",
          "* Combine",
          "* Ajoute de nouvelles idées inspirées des précédentes",
          "👉 On parle peu ou pas.",
          "👉 On construit sur les idées existantes.",
          "C’est là que la richesse collective apparaît."
        ],
      },
      {
        label: 'Mise en commun',
        duration: 15,
        page : './pages/innovation/paper-brain/Step4.jsx',
        description: [
          "Le groupe :",
          "* Affiche les idées au mur",
          "* Regroupe par thèmes",
          "* Clarifie si besoin",
          "Pas de critique à ce stade, juste clarification."
        ],
      },
      {
        label: 'Sélection / priorisation',
        duration: 10,
        page : './pages/innovation/paper-brain/Step5.jsx',
        description: [
          "On utilise ici un vote à gommettes",
          "Objectif : transformer la créativité en innovation exploitable."
        ],
      },
    ],
  };