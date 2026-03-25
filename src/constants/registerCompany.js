/**
 * @module constants/registerCompany
 * @description Step labels and initial form values for the company registration flow.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

/**
 * UI content displayed for each registration step.
 * @type {Object<number, {title:string, subtitle:string}>}
 */
export const REGISTER_COMPANY_STEP_CONTENT = {
  1: {
    title: "Créer un compte entreprise",
    subtitle: "Renseignez les informations générales de votre société.",
  },
  2: {
    title: "Adresse de la société",
    subtitle: "Indiquez l’adresse officielle de l’entreprise.",
  },
  3: {
    title: "Votre administrateur",
    subtitle: "Qui gérera ce compte au quotidien ?",
  },
  4: {
    title: "Sécuriser le compte",
    subtitle: "Choisissez un mot de passe robuste et acceptez les conditions.",
  },
  5: {
    title: "Vérifier & créer",
    subtitle: "Vérifiez les informations avant la création du compte.",
  },
};

/**
 * Initial state for the company registration form.
 * @type {{companyName:string, legalForm:string, siret:string, vatNumber:string, companyAddress:string, companyCity:string, companyZip:string, companyCountry:string, adminFirstName:string, adminLastName:string, adminEmail:string, adminPhone:string, password:string, passwordConfirm:string, acceptTerms:boolean}}
 */
export const REGISTER_COMPANY_INITIAL_FORM = {
  companyName: "",
  legalForm: "",
  siret: "",
  vatNumber: "",
  companyAddress: "",
  companyCity: "",
  companyZip: "",
  companyCountry: "Suisse",
  adminFirstName: "",
  adminLastName: "",
  adminEmail: "",
  adminPhone: "",
  password: "",
  passwordConfirm: "",
  acceptTerms: false,
};
