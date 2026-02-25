import { useState } from "react";
import zebra from '../assets/zebra.svg';

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
        <h1 className="text-5xl text-gray-800 font-bold mb-3">Bonjour Trucmuche,</h1>

        <form>
          <input
            name="email"
            type="email"
            placeholder="Votre e-mail d'entreprise"
            className="bg-white p-6 rounded shadow-md"
          />
        </form>
        {/* Lien pour creer un compte */}
        <a href="#" className="text-sm text-indigo-500 mt-4">
          Pas de compte ? Créez-en un
        </a>


      </div>
    </div>
  );
}

export default Login;