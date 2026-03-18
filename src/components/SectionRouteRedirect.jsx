import { Navigate } from "react-router-dom";
import { COLAB_DEFAULT_REDIRECT_PATH } from "../constants/routeAccess.js";
import useRouteAuthorization from "../hooks/useRouteAuthorization.js";
import RouteFallback from "./fallback/RouteFallback.jsx";

export default function SectionRouteRedirect({ links = [] }) {
  const { isLoading, isAuthenticated, resolveBestPath } = useRouteAuthorization();

  if (isLoading) {
    return <RouteFallback />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const candidatePaths = Array.isArray(links) ? links.map((link) => link?.to) : [];
  const redirectTo = resolveBestPath(candidatePaths, COLAB_DEFAULT_REDIRECT_PATH);

  return <Navigate to={redirectTo} replace />;
}
