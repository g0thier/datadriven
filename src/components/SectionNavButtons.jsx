import { useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { SECTION_LINKS_BY_ROOT } from "../constants/sectionLinks.js";
import useRouteAuthorization from "../hooks/useRouteAuthorization.js";
import { normalizePath } from "../utils/routeAccess.utils.js";
import MaterialIcon from "./MaterialIcon.jsx";

const linkBaseClassName = [
  "group relative inline-flex items-center rounded-lg",
  "px-3.5 py-2 text-sm font-medium",
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300",
].join(" ");

const tooltipClassName = [
  "pointer-events-none absolute left-1/2 top-full mt-0.5 -translate-x-1/2",
  "rounded bg-gray-900 px-2 py-1 text-xs whitespace-nowrap text-white",
  "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100",
].join(" ");

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
  const { isLoading, canAccessPath } = useRouteAuthorization();

  const styles = variantStyles[variant] || variantStyles.page;
  const visibleLinks = useMemo(() => {
    const source = Array.isArray(links) ? links : [];
    if (isLoading) return source;

    return source.filter((link) => {
      const path = normalizePath(link?.to);
      if (!path) return false;

      const isSectionRoot = Boolean(SECTION_LINKS_BY_ROOT[path]);
      if (isSectionRoot) return true;

      return canAccessPath(path);
    });
  }, [canAccessPath, isLoading, links]);

  if (visibleLinks.length === 0) return null;

  return (
    <nav aria-label={ariaLabel} className={`flex items-center ${className}`}>
      {visibleLinks.map((link, index) => (
        <NavLink
          key={`${link.to}-${link.label}-${index}`}
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
      ))}
    </nav>
  );
}
