import zebra from "../assets/zebra.svg";

function Mail() {
  const inviteeName = "Trucmuche"; // Le nom de la personne invitée 
  const inviterName = "Gauthier Rammault";
  const workshopTitle = "Paper Brain";
  const workshopDate = "13 02 2026 à 14h00";
  const workshopDuration = "50 minutes";
  const workshopLink = "https://zzzbre.com/innovation/paper-brain/jyw-qfgi-cjs"; // "{Lien vers l'atelier}"

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
              Bonjour {inviteeName},
            </h1>

            <div className="space-y-3 text-lg sm:text-xl text-gray-800">
              <p>Vous avez reçu une invitation de {inviterName},</p>
              <p>pour participer à un atelier de : <span className="font-semibold">{workshopTitle}</span></p>
              <p>
                Le <span className="font-semibold">{workshopDate}</span>, pour une durée de{" "}
                <span className="font-semibold">{workshopDuration}</span>
              </p>
            </div>

            {/* Capsule lien */}
            <div className="mt-8">
              <div className="flex items-center justify-center w-full bg-white rounded-2xl shadow-md px-5 py-4 border border-gray-200">
                <a
                  href={workshopLink}
                  className="text-indigo-700 font-semibold underline underline-offset-4 hover:text-indigo-900 text-center"
                >
                  {workshopLink}
                </a>
              </div>
            </div>

            {/* Boutons calendrier */}
            <div className="mt-10">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
                <a
                  href="#"
                  className="flex-1 text-center bg-gray-900 text-white font-semibold py-4 px-6 rounded-2xl shadow-md hover:bg-black transition"
                >
                  Calendrier Apple
                </a>
                <a
                  href="#"
                  className="flex-1 text-center bg-blue-700 text-white font-semibold py-4 px-6 rounded-2xl shadow-md hover:bg-blue-800 transition"
                >
                  Calendrier Microsoft
                </a>
                <a
                  href="#"
                  className="flex-1 text-center bg-white text-gray-900 font-semibold py-4 px-6 rounded-2xl shadow-md border border-gray-200 hover:bg-gray-50 transition"
                >
                  Calendrier Google
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default Mail;