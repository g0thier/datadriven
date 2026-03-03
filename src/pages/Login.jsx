import { useState } from "react";
import zebra from '../assets/zebra.svg';

function SwapLink({
  href = "#",
  part1,
  part2,
  align = "left", // left | center | right
}) {

  const alignmentClasses = {
    left: "justify-start text-left",
    center: "justify-center text-center",
    right: "justify-end text-right",
  };

  return (
    <a href={href} className="group inline-block text-sm text-indigo-500">
      
      {/* Conteneur largeur stable */}
      <span className="relative inline-block align-middle w-full">
        
        {/* Texte invisible pour fixer la largeur */}
        <span className="invisible whitespace-nowrap">
          {part1.length > part2.length ? part1 : part2}
        </span>

        {/* Fenêtre d'animation */}
        <span
          className={`
            absolute inset-0
            overflow-hidden
            h-[1.25em] leading-[1.25em]
            flex items-center
            ${alignmentClasses[align]}
          `}
        >
          
          {/* Texte 1 */}
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

          {/* Texte 2 */}
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
  const [switchEmailPassword, setSwitchEmailPassword] = useState(false);

  return (
    // fond jaune uni en tailwindcss qui prend toute la page,
    // avec un formulaire de login au centre.
    <div className="w-full bg-amber-300 min-h-screen">
      
      {/* Image de fond en tailwindcss qui prend toute la page*/}
      <img 
        src={zebra} 
        alt="Zebra" 
        className="absolute bottom-0 left-0 w-[60%] h-[60%] object-cover"
      />

      {/* Centre du formulaire */}
      <div className=" flex items-center justify-center flex-col h-screen relative">
        <h1 className="text-5xl text-gray-800 font-bold mb-6">Bonjour Trucmuche,</h1>

        <form>
          <input
            name="email"
            type="email"
            placeholder="truc.muche@exemple.com"
            className="bg-white p-6 rounded shadow-md"
          />
        </form>

        <div className="flex items-center gap-6 mt-3">
          {/* Lien pour creer un compte */}
          <SwapLink
            href="#"
            part1="Pas de compte ?"
            part2="Créez-en un !"
            align="center"
          />
          {/* Lien pour réinitialiser le mot de passe */}
          <SwapLink
            href="#"
            part1="Mot de passe oublié ?"
            part2="Réinitialisez-le !"
            align="center"
          />
        </div>
        
      </div>
    </div>
  );
}

export default Login;