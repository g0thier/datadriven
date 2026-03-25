/**
 * @module components/SectionRouteRedirect
 * @description UI component module for SectionRouteRedirect.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */
import { Navigate } from "react-router-dom";
import { COLAB_DEFAULT_REDIRECT_PATH } from "../constants/routeAccess.js";
import useRouteAuthorization from "../hooks/useRouteAuthorization.js";
import RouteFallback from "./fallback/RouteFallback.jsx";

/**
 * Renders the SectionRouteRedirect component.
 * @param {Object} props - Component props.
 * @param {Array} [props.links=[]] - links prop.
 * @returns {JSX.Element|null} Rendered component output.
 *
 * @example
 * import SectionRouteRedirect from "../components/SectionRouteRedirect.jsx";
 * import { innovationLinks } from "../constants/navigationLinks.js";
 *
 * // Real usage reference: src/App.jsx
 * <SectionRouteRedirect links={innovationLinks} />;
 */
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
