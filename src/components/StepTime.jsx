import { useMemo, useState } from "react";
import paperBrain from '../pages/innovation/assets/paper-brain.png'

const data = {
    title: 'Paper Brain',
    duration: '50 minutes',
    groupSize: 'à partir de 3 personnes',
    image: paperBrain,
    benefits: [
      'Générer beaucoup dʼidées en peu de temps.',
      'Éviter que certaines personnes monopolisent la parole',
      'Favoriser lʼintelligence collective',
      'Produire des idées variées et parfois inattendues'
    ],
    steps: [
      { label: 'Définition du défi',
        duration : 10,
        description: [
          "Le facilitateur pose une question claire, souvent formulée en **“Comment pourrions-nous… ?”**", 
          "Exemples :",
          "* Comment pourrions-nous améliorer l’expérience des télétravailleurs ?",
          "* Comment pourrions-nous réduire les irritants d’un parcours client ?",
          "* Comment pourrions-nous inventer un produit antistress pour cadres en burn-out ?",
          "👉 La question doit être précise mais ouverte."
        ],
        
        },
    ],

  };

function StepTime() {
  const [activityPicture] = useState(data.image);
  const [firstName, setFirstName] = useState("Gauthier");
  const [lastName, setLastName] = useState("Rammault");
  const [jobTitle, setJobTitle] = useState("Data Scientist");
  const [emailAddress, setEmailAddress] = useState("rammault.gauthier@example.com");
  const [phoneNumber, setPhoneNumber] = useState("123-456-7890");
  const [officeLocation, setOfficeLocation] = useState("Genève");

  const [isEditing, setIsEditing] = useState(false);

  const fullName = `${firstName} ${lastName}`;

  const fields = useMemo(
    () => [
      { label: "Prénom :", value: firstName, setter: setFirstName, id: "firstName" },
      { label: "Nom :", value: lastName, setter: setLastName, id: "lastName" },
      { label: "Profession :", value: jobTitle, setter: setJobTitle, id: "jobTitle" },
      { label: "Bureau :", value: officeLocation, setter: setOfficeLocation, id: "officeLocation" },
      { label: "Email :", value: emailAddress, setter: setEmailAddress, id: "emailAddress" },
      { label: "Téléphone :", value: phoneNumber, setter: setPhoneNumber, id: "phoneNumber" },
    ],
    [firstName, lastName, jobTitle, officeLocation]
  );

  return (
    <>
      <aside className="fixed right-6.25 top-21 bottom-12 w-80 bg-white rounded-2xl shadow-md p-5 z-9999 flex flex-col">
        <h2 className="text-xl font-bold mb-4">Atelier en groupe</h2>

        {/* 1er cadre arrondi */}
        <div className="rounded-2xl border border-gray-100 p-4 mb-4">
          <div className="flex items-center gap-3">
            <img
              src={activityPicture}
              alt="Profil"
              className="w-14 h-14 rounded-lg object-cover"  
            />
            <div className="min-w-0">
              <div className="font-semibold truncate">{data.title}</div>
              <div className="text-sm text-gray-600 truncate">⏱ {data.duration}</div>
              <div className="text-sm text-gray-500 truncate">👥 {data.groupSize}</div>
            </div>
          </div>
        </div>

        {/* 2e cadre arrondi */}
        <div className="rounded-2xl border border-gray-100 p-4 flex flex-col flex-1 min-h-0">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold">Étapes de la séance</div>
          </div>

          <div className="space-y-3 overflow-y-auto flex-1 pr-2 pb-4 min-h-0">
            {fields.map((f) => (
              <div key={f.id} className="flex flex-col">
                <div className="text-sm text-gray-600">{f.label}</div>
                {isEditing ? (
                  <input
                    id={f.id}
                    type="text"
                    value={f.value}
                    onChange={(e) => f.setter(e.target.value)}
                    className="w-full bg-transparent text-sm text-gray-900 outline-none border-b border-transparent focus:border-gray-300"
                  />
                ) : (
                  <div className="text-sm text-gray-900 wrap-break-word">
                    {f.value}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}

export default StepTime;