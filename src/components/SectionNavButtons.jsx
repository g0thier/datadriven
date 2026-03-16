import { NavLink, useLocation } from "react-router-dom";
import MaterialIcon from "./MaterialIcon.jsx";

const linkBaseClassName =
  "rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300";
const tooltipClassName =
  "absolute left-1/2 top-full mt-0.5 -translate-x-1/2 rounded bg-gray-900 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100";

const variantStyles = {
  navbar: {
    active: "text-white",
    inactive: "text-gray-800 hover:text-white",
  },
  page: {
    active: "text-amber-400",
    inactive: "text-slate-500 hover:text-amber-400",
  },
};

export default function SectionNavButtons({
  links = [],
  className = "",
  ariaLabel = "Navigation de section",
  variant = "page",
}) {
  const { pathname } = useLocation();

  if (!Array.isArray(links) || links.length === 0) return null;

  const styles = variantStyles[variant] || variantStyles.page;

  return (
    <nav aria-label={ariaLabel} className={`flex items-center gap-1 ${className}`}>
      {links.map((link, index) => (
        <div key={`${link.to}-${link.label}-${index}`} className="relative inline-block group">
          <NavLink
            to={link.to}
            end={link.end}
            className={({ isActive }) => {
              const isExcluded = (link.excludeActiveStartsWith || []).some((prefix) =>
                pathname.startsWith(prefix)
              );
              const effectiveActive = isActive && !isExcluded;

              return `${linkBaseClassName} ${effectiveActive ? styles.active : styles.inactive}`;
            }}
          >
            {link.icon ? <MaterialIcon name={link.icon} size={24} className="mt-2" /> : link.label}
            {link.icon ? <span className={tooltipClassName}>{link.label}</span> : null}
          </NavLink>
        </div>
      ))}
    </nav>
  );
}
