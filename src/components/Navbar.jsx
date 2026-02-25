import logotype from '../assets/logotype.svg';

export default function Navbar() {
  const links = [
    { label: "À venir", href: "#" },
    { label: "À venir", href: "#" },
    { label: "Innovation & Créativité", href: "#" },
    { label: "À venir", href: "#" },
    { label: "À venir", href: "#" },
  ];

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
        <ul className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {links.map((link) => (
            <li key={link.label} className="shrink-0">
              <a
                href={link.href}
                className={[
                  "rounded-lg px-3 py-2 text-sm font-medium text-gray-800",
                  "hover:text-white hover:text-shadow-xs",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
                ].join(" ")}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Bouton Profil à droite */}
        <div className="shrink-0">
          <button
            type="button"
            className="rounded-lg border px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
            onClick={() => alert("Profil")}
          >
            Profil
          </button>
        </div>
      </nav>
    </header>
  );
}