import { useState } from "react";

import { officeLocations, departments, teamMembers } from "./team/data_corp.jsx";
import data from "./innovation/data_cards.jsx";

function Workshop() {

  // TODO: Implement the Workshop page
  // Titre "Atelier"
  // Inviter des equipes avec {departments}
  // Ajouter des invité avec {teamMembers}
  // Selecteur de date pour la date de l'atelier
  // "{atelier.title}"(gauche) et sur la même ligne "Envoyer les invitations" (bouton) (droite)

  const atelier = data[0]; // Juste pour l'exemple, on prend le premier atelier de data

  return (
    <>
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-200 py-12 px-6">
        <h1 className='text-4xl font-bold text-gray-800 mb-8'>Inviter à un atelier</h1>
        <p>{atelier.title}</p>
      </div>
    </>
  );
}

export default Workshop;
