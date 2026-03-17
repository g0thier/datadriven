import { useNavigate } from "react-router-dom";
import { logout } from "../firebase";
import MaterialIcon from "../components/MaterialIcon";
import useCurrentUserProfile, { PROFILE_FIELDS } from "../hooks/useCurrentUserProfile";

function Profil() {
  const navigate = useNavigate();
  const { profile, isLoading, loadError } = useCurrentUserProfile();
  const fullName = `${profile.firstName} ${profile.lastName}`.trim() || "Utilisateur";

  const fields = PROFILE_FIELDS.map((field) => ({
    ...field,
    value: profile[field.key] || "",
  }));

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
            {profile.profilePicture ? (
              <img
                src={profile.profilePicture}
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
              <div className="text-sm text-gray-600 truncate">{profile.jobTitle || "Rôle non renseigné"}</div>
              <div className="text-sm text-gray-500 truncate">
                {profile.officeLocation || "Bureau non renseigné"}
              </div>
            </div>
          </div>
        </div>

        {/* 2e cadre arrondi */}
        <div className="rounded-2xl border border-gray-100 p-4 flex flex-col flex-1 min-h-0">
          <div className="font-semibold mb-3">Informations</div>

          {isLoading && <div className="text-xs text-gray-500 mb-2">Chargement du profil...</div>}
          {loadError && <div className="text-xs text-rose-600 mb-2">{loadError}</div>}

          <div className="space-y-3 overflow-y-auto flex-1 pr-2 pb-4 min-h-0">
            {fields.map((f) => (
              <div key={f.id} className="flex flex-col">
                <div className="text-sm text-gray-600">{f.label}</div>
                <div className="text-sm text-gray-900 wrap-break-word">
                  {f.value || "Non renseigné"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}

export default Profil;
