/**
 * @module components/ProtectedRoute
 * @description UI component module for ProtectedRoute.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */
// components/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { COLAB_DEFAULT_REDIRECT_PATH } from "../constants/routeAccess.js";
import { SECTION_LINKS_BY_ROOT } from "../constants/sectionLinks.js";
import useRouteAuthorization from "../hooks/useRouteAuthorization.js";
import { getSectionRootPath, normalizePath } from "../utils/routeAccess.utils.js";
import RouteFallback from "./fallback/RouteFallback";

/**
 * Renders the ProtectedRoute component.
 * @param {Object} props - Component props.
 * @param {*} props.children - children prop.
 * @returns {JSX.Element|null} Rendered component output.
 *
 * @example
 * import { Outlet } from "react-router-dom";
 * import ProtectedRoute from "../components/ProtectedRoute.jsx";
 *
 * // Real usage reference: src/App.jsx
 * <ProtectedRoute>
 *   <Outlet />
 * </ProtectedRoute>;
 */
export default function ProtectedRoute({ children }) {
  const { pathname } = useLocation();
  const { isLoading, isAuthenticated, canAccessPath, resolveTargetPath } =
    useRouteAuthorization();

  if (isLoading) {
    return <RouteFallback />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const normalizedPathname = normalizePath(pathname);
  if (!normalizedPathname || canAccessPath(normalizedPathname)) {
    return children;
  }

  const sectionRoot = getSectionRootPath(normalizedPathname);
  const sectionLinks = SECTION_LINKS_BY_ROOT[sectionRoot] || [];
  const candidatePaths = sectionLinks.map((link) => link?.to);
  const redirectTo = resolveTargetPath(
    normalizedPathname,
    candidatePaths,
    COLAB_DEFAULT_REDIRECT_PATH
  );

  if (!redirectTo || redirectTo === normalizedPathname) {
    return <Navigate to={COLAB_DEFAULT_REDIRECT_PATH} replace />;
  }

  return <Navigate to={redirectTo} replace />;
}
