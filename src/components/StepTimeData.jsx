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
          "Le facilitateur pose une question claire, souvent formulée en « Comment pourrions-nous… ? »",
          "Exemples :",
          "- Comment pourrions-nous améliorer l’expérience des télétravailleurs ?",
          "- Comment pourrions-nous réduire les irritants d’un parcours client ?",
          "- Comment pourrions-nous inventer un produit antistress pour cadres en burn-out ?",
          "👉 La question doit être précise mais ouverte."
        ],
      },
      {
        label: 'Phase individuelle',
        duration: 10,
        page : './pages/innovation/paper-brain/Step2.jsx',
        description: [
          "Chaque participant note ses idées :",
          "- Une idée par post-it",
          "- Sans discussion, ni autocensure",
          "Objectifs : éviter l’influence, libérer les introvertis et favoriser l’originalité."
        ],
      },
      {
        label: 'Rotation des feuilles',
        duration: 10,
        page : './pages/innovation/paper-brain/Step3.jsx',
        description: [
          "Les feuilles circulent entre les participants.",
          "Chacun lit, complète, améliore, combine et ajoute des idées.",
          "👉 On construit sur les idées existantes.",
          "La richesse collective émerge."
        ],
      },
      {
        label: 'Mise en commun',
        duration: 15,
        page : './pages/innovation/paper-brain/Step4.jsx',
        description: [
          "Le groupe :",
          "- Affiche les idées au mur",
          "- Regroupe par thèmes",
          "- Clarifie si besoin",
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