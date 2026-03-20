import helloImage from "../assets/paywall/hello.jpg";
import freelanceImage from "../assets/paywall/freelance.jpg";
import startupImage from "../assets/paywall/startup.jpg";

export const PLANS = [
  {
    name: "Hello",
    managers: 1,
    collaborators: 3,
    monthlyPrice: 0,
    previousMonthlyPrice: 24.99,
    launchLabel: "Offre de lancement",
    description: "Pack découverte",
    image: helloImage,
  },
  {
    name: "Freelance",
    managers: 1,
    collaborators: 8,
    monthlyPrice: 99,
    description: "Le début du succès",
    isRecommended: true,
    image: freelanceImage,
  },
  {
    name: "Startup",
    managers: 3,
    collaborators: 30,
    monthlyPrice: 299,
    description: "Le pilotage indispensable",
    image: startupImage,
  },
];
