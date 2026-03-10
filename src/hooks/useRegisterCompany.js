import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DEFAULT_DEPARTMENTS from "../constants/defaults";
import { registerCompanyAccount } from "../services/registerCompanyService";

const STEP_CONTENT = {
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

const INITIAL_FORM = {
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

function buildPayload(form) {
  return {
    company: {
      name: form.companyName,
      legalForm: form.legalForm,
      siret: form.siret,
      vatNumber: form.vatNumber,
      addresses: [
        {
          alias: "Siège",
          address: form.companyAddress,
          city: form.companyCity,
          zip: form.companyZip,
          country: form.companyCountry,
          isDefault: true,
        },
      ],
      departments: DEFAULT_DEPARTMENTS,
    },
    admin: {
      firstName: form.adminFirstName,
      lastName: form.adminLastName,
      email: form.adminEmail,
      phone: form.adminPhone,
    },
    acceptTerms: form.acceptTerms,
  };
}

export default function useRegisterCompany() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const navigate = useNavigate();

  const title = STEP_CONTENT[step]?.title ?? STEP_CONTENT[1].title;
  const subtitle = STEP_CONTENT[step]?.subtitle ?? "";

  const canGoNext = useMemo(() => {
    if (step === 1) {
      return form.companyName.trim().length > 0;
    }

    if (step === 2) {
      return (
        form.companyAddress.trim().length > 0 &&
        form.companyCity.trim().length > 0 &&
        form.companyZip.trim().length > 0 &&
        form.companyCountry.trim().length > 0
      );
    }

    if (step === 3) {
      return (
        form.adminFirstName.trim().length > 0 &&
        form.adminLastName.trim().length > 0 &&
        form.adminEmail.trim().length > 0
      );
    }

    if (step === 4) {
      return (
        form.password.length >= 8 &&
        form.passwordConfirm.length >= 8 &&
        form.password === form.passwordConfirm &&
        form.acceptTerms
      );
    }

    return true;
  }, [form, step]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleBack() {
    setSubmitError("");
    setStep((prev) => Math.max(1, prev - 1));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError("");

    if (step < 5) {
      if (!canGoNext) return;
      setStep((prev) => prev + 1);
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const payload = buildPayload(form);
      await registerCompanyAccount({
        email: form.adminEmail,
        password: form.password,
        payload,
      });
      navigate("/innovation");
    } catch (error) {
      setSubmitError(error?.message || "Erreur lors de la création du compte.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    step,
    title,
    subtitle,
    form,
    canGoNext,
    isSubmitting,
    submitError,
    updateField,
    handleBack,
    handleSubmit,
  };
}
