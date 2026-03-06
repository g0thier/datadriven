import { useState } from "react";
import zebra from '../../assets/zebra.svg';
import SwapLink from "../../components/SwapLink";
import MaterialIcon from "../../components/MaterialIcon";

function ResetPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    // 👉 Ici tu mettras ton appel API
    console.log("Email envoyé pour reset :", email);

    setSent(true);
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
        
        {!sent ? (
          <>
            <h1 className="text-5xl text-gray-800 font-bold mb-4 text-center">
              Mot de passe oublié ?
            </h1>

            <p className="text-gray-700 mb-8 text-center max-w-md">
              Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-row items-center gap-4">
              <input
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="truc.muche@exemple.com"
                className="bg-white p-6 rounded shadow-md w-80"
              />

              <button
                type="submit"
                className="bg-indigo-500 text-white p-4 rounded-full shadow-md hover:bg-indigo-600 transition flex items-center justify-center"
              >
                <MaterialIcon 
                  name="send"
                  size={24} 
                  className={
                    "h-6 w-6 brightness-0 invert rotate-330 -translate-y-px translate-px"
                  }
                />
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-4xl text-gray-800 font-bold mb-4 text-center flex items-center justify-center gap-3">
            <MaterialIcon 
              name="send"
              size={50} 
              className= "rotate-330 -translate-y-2 translate-x-3"
            />
            Email envoyé !
            </h1>

            <p className="text-gray-700 text-center max-w-md">
              Si un compte est associé à <strong>{email}</strong>, vous recevrez un email avec un lien de réinitialisation.
            </p>
          </>
        )}

        {/* Lien retour login */}
        <div className="mt-8">
          <SwapLink
            to="/login"
            part1="Retour à la connexion"
            part2="Se connecter"
            align="center"
          />
        </div>

      </div>
    </div>
  );
}

export default ResetPassword;