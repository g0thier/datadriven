import { useState } from "react";
import zebra from "../assets/zebra.svg";

function SwapLink({ href = "#", part1, part2, align = "left" }) {
  const alignmentClasses = {
    left: "justify-start text-left",
    center: "justify-center text-center",
    right: "justify-end text-right",
  };

  return (
    <a href={href} className="group inline-block text-sm text-indigo-500">
      <span className="relative inline-block align-middle w-full">
        <span className="invisible whitespace-nowrap">
          {part1.length > part2.length ? part1 : part2}
        </span>

        <span
          className={`
            absolute inset-0
            overflow-hidden
            h-[1.25em] leading-[1.25em]
            flex items-center
            ${alignmentClasses[align]}
          `}
        >
          <span
            className="
              absolute
              transition-all duration-300 ease-in-out
              group-hover:-translate-y-full
              group-hover:opacity-0
              whitespace-nowrap
            "
          >
            {part1}
          </span>

          <span
            className="
              absolute
              translate-y-full opacity-0
              transition-all duration-300 ease-in-out
              group-hover:translate-y-0
              group-hover:opacity-100
              whitespace-nowrap
            "
          >
            {part2}
          </span>
        </span>
      </span>
    </a>
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Step-by-step : d'abord email, puis password
  const [step, setStep] = useState(1); // 1 = email, 2 = password
  const icon = "./src/assets/material/send_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.svg";
  const passwordIcon = "./src/assets/material/password_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.svg";

  const handleSubmit = (e) => {
    e.preventDefault();

    if (step === 1) {
      // passe à l'étape password
      setStep(2);
      return;
    }

    // 👉 Ici tu mettras ton appel API login
    console.log("Login :", { email, password });
  };

  const handleBack = () => {
    setStep(1);
    setPassword("");
  };

  return (
    <div className="w-full bg-amber-300 min-h-screen">
      {/* Image décorative */}
      <img
        src={zebra}
        alt="Zebra"
        className="absolute bottom-0 left-0 w-[60%] h-[60%] object-cover"
      />

      {/* Centre */}
      <div className="flex items-center justify-center flex-col h-screen relative px-6">
        <h1 className="text-5xl text-gray-800 font-bold mb-4 text-center">
          Connexion
        </h1>

        <p className="text-gray-700 mb-8 text-center max-w-md">
          {step === 1
            ? "Entrez votre adresse email pour continuer."
            : "Entrez votre mot de passe pour vous connecter."}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-row items-center gap-4">
          {step === 1 ? (
            <input
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="truc.muche@exemple.com"
              className="bg-white p-6 rounded shadow-md w-80"
            />
          ) : (
            <input
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Votre mot de passe"
              className="bg-white p-6 rounded shadow-md w-80"
            />
          )}

          <button
            type="submit"
            className="bg-indigo-500 text-white p-4 rounded-full shadow-md hover:bg-indigo-600 transition flex items-center justify-center"
            aria-label={step === 1 ? "Continuer" : "Se connecter"}
          >
            <img
              src={step === 1 ? passwordIcon : icon}
              alt=""
              className={step === 1 ? 
                "h-6 w-6 brightness-0 invert" : 
                "h-6 w-6 brightness-0 invert rotate-330 -translate-y-px translate-px"}
            />
          </button>
        </form>


        {/* Liens */}
        <div className="flex items-center gap-6 mt-8">
          <SwapLink
            href="/register"
            part1="Pas de compte ?"
            part2="Créez-en un !"
            align="center"
          />
          <SwapLink
            href="/reset-password"
            part1="Mot de passe oublié ?"
            part2="Réinitialisez-le !"
            align="center"
          />
          {step === 2 && (
            <button
              type="button"
              onClick={handleBack}
              className=" text-sm text-indigo-500 hover:text-indigo-900"
            >
              Revenir à l’email
            </button>
          )}
        </div>
        {/* Bouton retour (quand on est au step 2) */}

      </div>
    </div>
  );
}

export default Login;