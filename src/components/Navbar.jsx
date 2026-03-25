/**
 * @module components/Navbar
 * @description UI component module for Navbar.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */
import { useState } from "react";
import { NavLink } from "react-router-dom";
import logotype from "../assets/logotype.svg";
import Profil from "./Profil.jsx";
import MaterialIcon from "../components/MaterialIcon";
import { navbarLinks } from "../constants/navigationLinks.js";
import SectionNavButtons from "./SectionNavButtons.jsx";

/**
 * Renders the Navbar component.
 * @returns {JSX.Element|null} Rendered component output.
 *
 * @example
 * import Navbar from "../components/Navbar";
 *
 * // Real usage reference: src/pages/Team.jsx
 * <Navbar />;
 */
export default function Navbar() {
  const [openProfil, setOpenProfil] = useState(false);

  return (
    <>
      <header className="w-full border-b bg-amber-300">
        <nav className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <NavLink to="/innovation" className="shrink-0 text-lg font-semibold">
            <img src={logotype} alt="Logo" className="ml-2 inline-block h-10 w-10" />
          </NavLink>

          <div className="flex min-w-0 flex-1 items-center gap-1">
            <SectionNavButtons
              links={navbarLinks}
              ariaLabel="Navigation principale (SectionNavButtons)"
              variant="navbar"
            />
          </div>

          <div className="shrink-0">
            <button
              type="button"
              className="rounded-lg border px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
              onClick={() => setOpenProfil((v) => !v)}
            >
              Profil
              <MaterialIcon name="account_circle" size={20} className="ml-2 translate-y-1" />
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