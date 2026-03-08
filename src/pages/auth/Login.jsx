import { useState, useEffect } from "react";
import zebra from "../../assets/zebra.svg";
import SwapLink from "../../components/SwapLink";
import MaterialIcon from "../../components/MaterialIcon";

import { useNavigate } from "react-router-dom";
import {signInWithEmail, onAuthStateChangedListener} from "../../firebase/config";

function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChangedListener((user) => {
      if (user) {
        navigate("/innovation", { replace: true });
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Step-by-step : d'abord email, puis password
  const [step, setStep] = useState(1); // 1 = email, 2 = password

  const handleSubmit = (e) => {
    e.preventDefault();

    if (step === 1) {
      // passe à l'étape password
      setStep(2);
      return;
    }

    // à l'étape 2, on tente de se connecter
    signInWithEmail(email, password);
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
            <MaterialIcon 
              name={step === 1 ? "password" : "send"} 
              size={24} 
              className={step === 1 ? "" : "rotate-330 -translate-y-px translate-px"}
            />
          </button>
        </form>


        {/* Liens */}
        <div className="flex items-center gap-6 mt-8">
          <SwapLink
            to="/register"
            part1="Pas de compte ?"
            part2="Créez-en un !"
            align="center"
          />
          <SwapLink
            to="/reset-password"
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

      </div>
    </div>
  );
}

export default Login;