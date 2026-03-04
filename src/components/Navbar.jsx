import { useState } from "react";
import { NavLink } from "react-router-dom";
import logotype from "../assets/logotype.svg";
import Profil from "./Profil.jsx";

export default function Navbar() {
  const [openProfil, setOpenProfil] = useState(false);

  const links = [
    { label: "À venir", to: "/", icon: "./src/assets/material/select_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.svg" },
    { label: "À venir", to: "/", icon: "./src/assets/material/select_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.svg" },
    { label: "Innovation & Créativité", to: "/innovation", icon: "./src/assets/material/emoji_objects_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.svg" },
    { label: "Gestion des Ressources Humaines", to: "/team", icon: "./src/assets/material/conversation_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.svg" },
    { label: "À venir", to: "/", icon: "./src/assets/material/select_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.svg" },
  ];

  const base = "rounded-lg px-3 py-2 text-sm font-medium text-gray-800 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300";
  const tooltip = "absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap";

  return (
    <>
      <header className="w-full border-b bg-amber-300">
        <nav className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <NavLink to="/workshop" className="shrink-0 text-lg font-semibold">
            <img src={logotype} alt="Logo" className="ml-2 inline-block h-10 w-10" />
          </NavLink>

          <div className="flex min-w-0 flex-1 items-center gap-1">
            {links.map((link, i) => (
              <div key={`${link.label}-${i}`} className="shrink-0">
                <div className="relative inline-block group">
                  <NavLink
                    to={link.to}
                    end // important: évite qu’un parent /innovation active d’autres trucs
                    className={base}
                  >
                    <img src={link.icon} alt={`${link.label} icon`} className="inline-block h-5 w-5" />
                    <span className={tooltip}>{link.label}</span>
                  </NavLink>
                </div>
              </div>
            ))}
          </div>

          <div className="shrink-0">
            <button
              type="button"
              className="rounded-lg border px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
              onClick={() => setOpenProfil((v) => !v)}
            >
              Profil
              <img
                src="./src/assets/material/account_circle_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.svg"
                alt=""
                className="inline-block h-5 w-5 ml-2"
              />
            </button>
          </div>
        </nav>
      </header>

      <aside
        className={`fixed right-0 top-16 z-40 h-[calc(100vh-4rem)] w-[min(420px,90vw)] transition-transform duration-300 ${
          openProfil ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <Profil />
      </aside>
    </>
  );
}