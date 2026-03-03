import zebra from "../assets/zebra.svg";

function ResetPasswordMail() {
  const userName = "Trucmuche"; // Nom de l'utilisateur
  const resetLink = "https://example.com/reset-password?token=123456"; // Lien de réinitialisation
  const expirationTime = "30 minutes"; // Durée de validité du lien

  return (
    <div className="w-full bg-amber-300 min-h-screen relative overflow-hidden">
      {/* Fond zebra */}
      <img
        src={zebra}
        alt="Zebra"
        className="absolute bottom-0 left-0 w-[60%] h-[60%] object-cover pointer-events-none select-none opacity-90"
      />

      {/* Contenu */}
      <div className="min-h-screen relative flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-3xl">
          <div className="bg-white rounded-3xl shadow-xl p-8 sm:p-12">
            <h1 className="text-4xl sm:text-5xl text-gray-900 font-extrabold mb-6">
              Bonjour {userName},
            </h1>

            <div className="space-y-4 text-lg sm:text-xl text-gray-800">
              <p>
                Vous avez demandé à réinitialiser votre mot de passe ?
              </p>
              <p>
                Cliquez sur le bouton ci-dessous pour en choisir un nouveau.
              </p>
              <p className="text-base text-gray-600">
                Si vous n’êtes pas à l’origine de cette demande, vous pouvez ignorer cet email en toute sécurité.
              </p>
            </div>

            {/* Bouton principal */}
            <div className="mt-10">
              <a
                href={resetLink}
                className="block w-full text-center bg-gray-900 text-white font-semibold py-5 px-6 rounded-2xl shadow-md hover:bg-black transition text-lg"
              >
                Réinitialiser mon mot de passe
              </a>
            </div>

            {/* Mention sécurité */}
            <div className="mt-8 text-sm text-gray-500 text-center">
              <p>
                Pour des raisons de sécurité, ce lien expirera automatiquement après {expirationTime}.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordMail;