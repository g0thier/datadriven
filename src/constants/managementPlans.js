import helloImage from "../assets/paywall/hello.jpg";
import freelanceImage from "../assets/paywall/freelance.jpg";
import startupImage from "../assets/paywall/startup.jpg";

/**
 * @module constants/managementPlans
 * @description Catalog of management subscription plans displayed on the paywall.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

/**
 * Available subscription plans with quota and pricing metadata.
 * @type {Array<{name:string, owner:number, leader:number, colab:number, monthlyPrice:number, previousMonthlyPrice?:number, launchLabel?:string, description:string, isRecommended?:boolean, image:string}>}
 */
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
