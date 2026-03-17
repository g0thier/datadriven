import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { useNavigate } from "react-router-dom";
import { database, logout, onAuthStateChangedListener } from "../firebase";
import MaterialIcon from "../components/MaterialIcon";

const ROLE_LABELS = {
  owner: "Propriétaire",
  leader: "Manager",
  colab: "Collaborateur",
};

const parseDisplayName = (displayName = "") => {
  const parts = String(displayName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return { firstName: "", lastName: "" };

  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
};

const normalizeRoleLabel = (role = "") => {
  const normalizedRole = String(role || "").trim().toLowerCase();
  if (!normalizedRole) return "";
  return ROLE_LABELS[normalizedRole] || normalizedRole;
};

const resolveOfficeLocation = (officeData = {}) => {
  const alias = String(officeData?.alias || "").trim();
  if (alias) return alias;

  const city = String(officeData?.city || "").trim();
  if (city) return city;

  return String(officeData?.address || "").trim();
};

function Profil() {
  const navigate = useNavigate();
  const [profilPicture, setProfilPicture] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [officeLocation, setOfficeLocation] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [isEditing, setIsEditing] = useState(false);

  const fullName = `${firstName} ${lastName}`.trim() || "Utilisateur";

  useEffect(() => {
    let unsubscribeUser = () => {};
    let unsubscribeOffice = () => {};

    const resetProfile = () => {
      setProfilPicture("");
      setFirstName("");
      setLastName("");
      setJobTitle("");
      setEmailAddress("");
      setPhoneNumber("");
      setOfficeLocation("");
      setLoadError("");
      setIsLoading(false);
      setIsEditing(false);
    };

    const unsubscribeAuth = onAuthStateChangedListener((currentUser) => {
      unsubscribeUser();
      unsubscribeUser = () => {};
      unsubscribeOffice();
      unsubscribeOffice = () => {};

      if (!currentUser) {
        resetProfile();
        return;
      }

      setIsLoading(true);
      setLoadError("");
      setProfilPicture(String(currentUser.photoURL || "").trim());

      const userRef = ref(database, `users/${currentUser.uid}`);
      unsubscribeUser = onValue(
        userRef,
        (snapshot) => {
          const userData = snapshot.exists() ? snapshot.val() || {} : {};
          const fallbackName = parseDisplayName(currentUser.displayName);

          setFirstName(String(userData?.firstName || fallbackName.firstName || "").trim());
          setLastName(String(userData?.lastName || fallbackName.lastName || "").trim());
          setJobTitle(normalizeRoleLabel(userData?.role));
          setEmailAddress(String(userData?.email || currentUser.email || "").trim());
          setPhoneNumber(String(userData?.phone || "").trim());

          const picture = String(userData?.photoURL || currentUser.photoURL || "").trim();
          setProfilPicture(picture);

          unsubscribeOffice();
          unsubscribeOffice = () => {};
          setOfficeLocation("");

          const companyId = String(userData?.companyId || "").trim();
          const officeId = String(userData?.officeId || "").trim();

          if (companyId && officeId) {
            const officeRef = ref(database, `companies/${companyId}/addresses/${officeId}`);
            unsubscribeOffice = onValue(officeRef, (officeSnapshot) => {
              const officeData = officeSnapshot.exists() ? officeSnapshot.val() || {} : {};
              setOfficeLocation(resolveOfficeLocation(officeData));
            });
          }

          setIsLoading(false);
        },
        (error) => {
          console.error("Impossible de charger le profil utilisateur :", error);
          setLoadError("Impossible de charger le profil.");
          setIsLoading(false);
        }
      );
    });

    return () => {
      unsubscribeUser();
      unsubscribeOffice();
      unsubscribeAuth();
    };
  }, []);

  const fields = [
    { label: "Prénom :", value: firstName, setter: setFirstName, id: "firstName" },
    { label: "Nom :", value: lastName, setter: setLastName, id: "lastName" },
    { label: "Profession :", value: jobTitle, setter: setJobTitle, id: "jobTitle" },
    { label: "Bureau :", value: officeLocation, setter: setOfficeLocation, id: "officeLocation" },
    { label: "Email :", value: emailAddress, setter: setEmailAddress, id: "emailAddress" },
    { label: "Téléphone :", value: phoneNumber, setter: setPhoneNumber, id: "phoneNumber" },
  ];

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
            {profilPicture ? (
              <img
                src={profilPicture}
                alt="Profil"
                className="w-14 h-14 rounded-full object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center">
                <MaterialIcon name="account_circle" size={34} />
              </div>
            )}
            <div className="min-w-0">
              <div className="font-semibold truncate">{fullName}</div>
              <div className="text-sm text-gray-600 truncate">{jobTitle || "Rôle non renseigné"}</div>
              <div className="text-sm text-gray-500 truncate">
                {officeLocation || "Bureau non renseigné"}
              </div>
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

          {isLoading && <div className="text-xs text-gray-500 mb-2">Chargement du profil...</div>}
          {loadError && <div className="text-xs text-rose-600 mb-2">{loadError}</div>}

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
                    {f.value || "Non renseigné"}
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
