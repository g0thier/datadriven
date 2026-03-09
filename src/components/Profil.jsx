import { useMemo, useState } from "react";
import { logout } from "../firebase";
import MaterialIcon from "../components/MaterialIcon";

function Profil() {
  const [profilPicture] = useState(
    "https://media.licdn.com/dms/image/v2/D4E03AQF95-ys7n70rA/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1693258502282?e=1773878400&v=beta&t=-IGqDI9I-2-te4Ifl8BqHllje898kfqJP5UtMoeKEHU"
  );

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

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <>
      <aside className="fixed right-6 top-6 bottom-6 w-80 bg-white rounded-2xl shadow-md p-5 z-9999 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Mon Profil</h2>

          <button onClick={handleLogout}>
            <MaterialIcon 
              name="account_circle_off" 
              className="text-indigo-600 hover:text-rose-800 transition-colors duration-600" />
          </button>
        </div>

        {/* 1er cadre arrondi */}
        <div className="rounded-2xl border border-gray-100 p-4 mb-4">
          <div className="flex items-center gap-3">
            <img
              src={profilPicture}
              alt="Profil"
              className="w-14 h-14 rounded-full object-cover"
            />
            <div className="min-w-0">
              <div className="font-semibold truncate">{fullName}</div>
              <div className="text-sm text-gray-600 truncate">{jobTitle}</div>
              <div className="text-sm text-gray-500 truncate">{officeLocation}</div>
            </div>
          </div>
        </div>

        {/* 2e cadre arrondi */}
        <div className="rounded-2xl border border-gray-100 p-4 flex flex-col flex-1 min-h-0">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold">Informations</div>
            <button
              type="button"
              onClick={() => setIsEditing((v) => !v)}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              {isEditing ? "Terminer" : "Modifier"}
            </button>
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

export default Profil;