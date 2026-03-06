import { useMemo, useState } from "react";
import zebra from "../../assets/zebra.svg";
import SwapLink from "../../components/SwapLink";
import MaterialIcon from "../../components/MaterialIcon";

function RegisterCompany() {
  // Step-by-step :
  // 1 = Infos société
  // 2 = Adresse
  // 3 = Infos admin
  // 4 = Mot de passe
  // 5 = Confirmation
  const [step, setStep] = useState(1);

  // --- Entreprise
  const [companyName, setCompanyName] = useState("");
  const [legalForm, setLegalForm] = useState(""); // SA, SARL, etc.
  const [siret, setSiret] = useState(""); // si FR; sinon UID (CH) / n° TVA etc.
  const [vatNumber, setVatNumber] = useState(""); // TVA
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyCity, setCompanyCity] = useState("");
  const [companyZip, setCompanyZip] = useState("");
  const [companyCountry, setCompanyCountry] = useState("Suisse");

  // --- Admin
  const [adminFirstName, setAdminFirstName] = useState("");
  const [adminLastName, setAdminLastName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPhone, setAdminPhone] = useState("");

  // --- Sécurité
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  const title = useMemo(() => {
    switch (step) {
      case 1:
        return "Créer un compte entreprise";
      case 2:
        return "Adresse de la société";
      case 3:
        return "Votre administrateur";
      case 4:
        return "Sécuriser le compte";
      case 5:
        return "Vérifier & créer";
      default:
        return "Créer un compte entreprise";
    }
  }, [step]);

  const subtitle = useMemo(() => {
    switch (step) {
      case 1:
        return "Renseignez les informations générales de votre société.";
      case 2:
        return "Indiquez l’adresse officielle de l’entreprise.";
      case 3:
        return "Qui gérera ce compte au quotidien ?";
      case 4:
        return "Choisissez un mot de passe robuste et acceptez les conditions.";
      case 5:
        return "Vérifiez les informations avant la création du compte.";
      default:
        return "";
    }
  }, [step]);

  const canGoNext = useMemo(() => {
    if (step === 1) {
      return companyName.trim();
    }

    if (step === 2) {
      return (
        companyAddress.trim() &&
        companyCity.trim() &&
        companyZip.trim() &&
        companyCountry.trim()
      );
    }

    if (step === 3) {
      return (
        adminFirstName.trim() &&
        adminLastName.trim() &&
        adminEmail.trim()
      );
    }

    if (step === 4) {
      return (
        password.length >= 8 &&
        passwordConfirm.length >= 8 &&
        password === passwordConfirm &&
        acceptTerms
      );
    }

    return true;
  }, [
    step,
    companyName,
    companyAddress,
    companyCity,
    companyZip,
    companyCountry,
    adminFirstName,
    adminLastName,
    adminEmail,
    password,
    passwordConfirm,
    acceptTerms,
  ]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (step < 5) {
      if (!canGoNext) return;
      setStep((s) => s + 1);
      return;
    }

    // 👉 Ici tu mettras ton appel API register company
    const payload = {
      company: {
        name: companyName,
        legalForm,
        siret,
        vatNumber,
        address: companyAddress,
        city: companyCity,
        zip: companyZip,
        country: companyCountry,
      },
      admin: {
        firstName: adminFirstName,
        lastName: adminLastName,
        email: adminEmail,
        phone: adminPhone,
      },
      security: { password },
      acceptTerms,
    };

    console.log("RegisterCompany :", payload);
  };

  const handleBack = () => {
    setStep((s) => Math.max(1, s - 1));
  };

  const inputClass =
    "bg-white p-5 rounded shadow-md w-80 md:w-[420px]";

  return (
    <div className="w-full bg-amber-300 min-h-screen">
      {/* Image décorative */}
      <img
        src={zebra}
        alt="Zebra"
        className="absolute bottom-0 left-0 w-[60%] h-[60%] object-cover"
      />

      {/* Centre */}
      <div className="flex items-center justify-center flex-col min-h-screen relative px-6 py-10">
        <h1 className="text-4xl md:text-5xl text-gray-800 font-bold mb-4 text-center">
          {title}
        </h1>

        <p className="text-gray-700 mb-8 text-center max-w-md">
          {subtitle}
        </p>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((n) => (
            <div
              key={n}
              className={
                "h-2 w-10 rounded-full " +
                (step >= n ? "bg-indigo-600" : "bg-indigo-200")
              }
            />
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col items-center gap-4 w-full"
        >
          {/* STEP 1 — Entreprise */}
          {step === 1 && (
            <div className="flex flex-col gap-4 items-center w-full">

            <input
                className={inputClass}
                name="companyName"
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Nom de l’entreprise"
            />

            <div className="flex flex-col md:flex-row gap-4 items-center w-full justify-center">
                <input
                className="bg-white p-5 rounded shadow-md w-80 md:w-51.25"
                name="legalForm"
                type="text"
                value={legalForm}
                onChange={(e) => setLegalForm(e.target.value)}
                placeholder="Forme (SA, Sàrl...)"
                />
                <input
                className="bg-white p-5 rounded shadow-md w-80 md:w-51.25"
                name="vatNumber"
                type="text"
                value={vatNumber}
                onChange={(e) => setVatNumber(e.target.value)}
                placeholder="N° TVA (optionnel)"
                />
            </div>

            <input
                className={inputClass}
                name="siret"
                type="text"
                value={siret}
                onChange={(e) => setSiret(e.target.value)}
                placeholder="N° registre (UID/SIRET) (optionnel)"
            />

            </div>
          )}

          {/* STEP 2 — Adresse */}
          {step === 2 && (
            <div className="flex flex-col gap-4 items-center w-full">

                <input
                className={inputClass}
                name="companyAddress"
                type="text"
                required
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                placeholder="Adresse"
                />

                <div className="flex flex-col md:flex-row gap-4 items-center w-full justify-center">
                <input
                    className="bg-white p-5 rounded shadow-md w-80 md:w-51.25"
                    name="companyZip"
                    type="text"
                    required
                    value={companyZip}
                    onChange={(e) => setCompanyZip(e.target.value)}
                    placeholder="Code postal"
                />
                <input
                    className="bg-white p-5 rounded shadow-md w-80 md:w-51.25"
                    name="companyCity"
                    type="text"
                    required
                    value={companyCity}
                    onChange={(e) => setCompanyCity(e.target.value)}
                    placeholder="Ville"
                />
                </div>

                <input
                className={inputClass}
                name="companyCountry"
                type="text"
                required
                value={companyCountry}
                onChange={(e) => setCompanyCountry(e.target.value)}
                placeholder="Pays"
                />

            </div>
          )}

          {/* STEP 3 — Admin */}
          {step === 3 && (
            <div className="flex flex-col gap-4 items-center w-full">
              <div className="flex flex-col md:flex-row gap-4 items-center w-full justify-center">
                <input
                  className="bg-white p-5 rounded shadow-md w-80 md:w-51.25"
                  name="adminFirstName"
                  type="text"
                  required
                  value={adminFirstName}
                  onChange={(e) => setAdminFirstName(e.target.value)}
                  placeholder="Prénom"
                />
                <input
                  className="bg-white p-5 rounded shadow-md w-80 md:w-51.25"
                  name="adminLastName"
                  type="text"
                  required
                  value={adminLastName}
                  onChange={(e) => setAdminLastName(e.target.value)}
                  placeholder="Nom"
                />
              </div>

              <input
                className={inputClass}
                name="adminEmail"
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="Email professionnel"
              />

              <input
                className={inputClass}
                name="adminPhone"
                type="tel"
                value={adminPhone}
                onChange={(e) => setAdminPhone(e.target.value)}
                placeholder="Téléphone (optionnel)"
              />
            </div>
          )}

          {/* STEP 4 — Password + CGU */}
          {step === 4 && (
            <div className="flex flex-col gap-4 items-center w-full">
              <input
                className={inputClass}
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe (8+ caractères)"
              />
              <input
                className={inputClass}
                name="passwordConfirm"
                type="password"
                required
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="Confirmer le mot de passe"
              />

              {passwordConfirm.length > 0 && password !== passwordConfirm && (
                <p className="text-sm text-red-700">
                  Les mots de passe ne correspondent pas.
                </p>
              )}

              <label className="flex items-center gap-3 bg-white/70 rounded px-4 py-3 shadow-md w-80 md:w-105">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                />
                <span className="text-sm text-gray-800">
                  J’accepte les conditions d’utilisation et la politique de confidentialité.
                </span>
              </label>
            </div>
          )}

          {/* STEP 5 — Recap */}
          {step === 5 && (
            <div className="bg-white/70 rounded shadow-md w-80 md:w-105 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Récapitulatif
              </h2>

              <div className="text-sm text-gray-800 space-y-3">
                <div>
                  <p className="font-semibold">Entreprise</p>
                  <p>{companyName}</p>
                  <p className="text-gray-700">
                    {companyAddress}, {companyZip} {companyCity}, {companyCountry}
                  </p>
                  {(legalForm || vatNumber || siret) && (
                    <p className="text-gray-700">
                      {legalForm ? `Forme: ${legalForm} · ` : ""}
                      {vatNumber ? `TVA: ${vatNumber} · ` : ""}
                      {siret ? `Registre: ${siret}` : ""}
                    </p>
                  )}
                </div>

                <div>
                  <p className="font-semibold">Administrateur</p>
                  <p>
                    {adminFirstName} {adminLastName}
                  </p>
                  <p className="text-gray-700">{adminEmail}</p>
                  {adminPhone && <p className="text-gray-700">{adminPhone}</p>}
                </div>

                <p className="text-xs text-gray-600">
                  En créant le compte, vous pourrez ensuite inviter des collaborateurs et compléter les infos légales.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 mt-4">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="bg-white text-gray-800 p-4 rounded-full shadow-md hover:bg-gray-50 transition flex items-center justify-center"
                aria-label="Retour"
              >
                <MaterialIcon 
                  name="arrow_back" 
                  size={24} 
                />
              </button>
            )}

            <button
              type="submit"
              disabled={!canGoNext}
              className={
                "bg-indigo-500 text-white p-4 rounded-full shadow-md transition flex items-center justify-center " +
                (canGoNext
                  ? "hover:bg-indigo-600"
                  : "opacity-50 cursor-not-allowed")
              }
              aria-label={step < 4 ? "Continuer" : "Créer le compte"}
            >
              <MaterialIcon 
                name={step === 3 ? "password" : step < 5 ? "arrow_right_alt" : "send"}
                size={24} 
                className={
                  "h-6 w-6 brightness-0 invert " +
                  (step === 5 ? "rotate-330 -translate-y-px translate-px" : "")
                }
              />
            </button>
          </div>
        </form>

        {/* Liens */}
        <div className="flex items-center gap-6 mt-8 flex-wrap justify-center">
          <SwapLink
            to="/login"
            part1="Déjà un compte ?"
            part2="Connectez-vous !"
            align="center"
          />
        </div>
      </div>
    </div>
  );
}

export default RegisterCompany;