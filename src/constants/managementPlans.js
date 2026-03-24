import helloImage from "../assets/paywall/hello.jpg";
import freelanceImage from "../assets/paywall/freelance.jpg";
import startupImage from "../assets/paywall/startup.jpg";

export const PLANS = [
  {
    name: "Hello",
    owner: 1,
    leader: 0,
    colab: 3,
    monthlyPrice: 0,
    previousMonthlyPrice: 24.99,
    launchLabel: "Offre de lancement",
    description: "Pack découverte",
    image: helloImage,
  },
  {
    name: "Freelance",
    owner: 1,
    leader: 0,
    colab: 8,
    monthlyPrice: 99,
    description: "Le début du succès",
    isRecommended: true,
    image: freelanceImage,
  },
  {
    name: "Startup",
    owner: 1,
    leader: 2,
    colab: 30,
    monthlyPrice: 299,
    description: "Le pilotage indispensable",
    image: startupImage,
  },
];
