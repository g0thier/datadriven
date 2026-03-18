// components/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { COLAB_DEFAULT_REDIRECT_PATH } from "../constants/routeAccess.js";
import { SECTION_LINKS_BY_ROOT } from "../constants/sectionLinks.js";
import useRouteAuthorization from "../hooks/useRouteAuthorization.js";
import {
  getSectionRootPath,
  normalizePath,
  resolveAuthorizedTargetPath,
} from "../utils/routeAccess.utils.js";
import RouteFallback from "./fallback/RouteFallback";

export default function ProtectedRoute({ children }) {
  const { pathname } = useLocation();
  const { isLoading, isAuthenticated, role, leaderPageAccess, canAccessPath } =
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
  const redirectTo = resolveAuthorizedTargetPath({
    targetPath: normalizedPathname,
    candidatePaths,
    role,
    leaderPageAccess,
    fallbackPath: COLAB_DEFAULT_REDIRECT_PATH,
  });

  if (!redirectTo || redirectTo === normalizedPathname) {
    return <Navigate to={COLAB_DEFAULT_REDIRECT_PATH} replace />;
  }

  return <Navigate to={redirectTo} replace />;
}
