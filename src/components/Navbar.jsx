import logotype from '../assets/logotype.svg';

export default function Navbar() {
  const links = [
    { label: "À venir", href: "#", icon: "./src/assets/material/select_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.svg" },
    { label: "À venir", href: "#", icon: "./src/assets/material/select_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.svg" },
    { label: "Innovation & Créativité", href: "#", icon: "./src/assets/material/emoji_objects_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.svg" },
    { label: "Gestion des Ressources Humaines", href: "#", icon: "./src/assets/material/conversation_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.svg" },
    { label: "À venir", href: "#", icon: "./src/assets/material/select_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.svg" },
  ];

  const class1= "rounded-lg px-3 py-2 text-sm font-medium text-gray-800 hover:text-white hover:text-shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
  const class2= "absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap"

  return (
    <header className="w-full border-b bg-amber-300">
      <nav className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        {/* Logo / Brand */}
        <a href="#" className="shrink-0 text-lg font-semibold">
          <img
            src={logotype}
            alt="Logo"
            className="ml-2 inline-block h-10 w-10"
          />
        </a>

        {/* Liens */}
        <div className="flex min-w-0 flex-1 items-center gap-1">
          {links.map((link) => (
            <div key={link.label} className="shrink-0">
              <div className="relative inline-block group">
                <a href="#" className={class1}>
                  <img src={link.icon} alt={`${link.label} icon`} className="inline-block h-5 w-5" />
                  <span className={class2}>
                    {link.label}
                  </span>
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Bouton Profil à droite */}
        <div className="shrink-0">
          <button
            type="button"
            className="rounded-lg border px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
            onClick={() => alert("Profil")}
          >
            Profil
            <img src="./src/assets/material/account_circle_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.svg" alt="Profil icon" className="inline-block h-5 w-5 ml-2" />
          </button>
        </div>
      </nav>
    </header>
  );
}