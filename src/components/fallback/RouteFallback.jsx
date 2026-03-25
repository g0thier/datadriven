/**
 * @module components/fallback/RouteFallback
 * @description UI component module for RouteFallback.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */
import animate from "../../assets/animate.svg";
import "./RouteFallback.css";

/**
 * Renders the RouteFallback component.
 * @returns {JSX.Element|null} Rendered component output.
 *
 * @example
 * import RouteFallback from "../components/fallback/RouteFallback.jsx";
 *
 * // Real usage reference: src/App.jsx
 * <RouteFallback />;
 */
export default function RouteFallback() {
  return (
    <div className="route-fallback">
      <img src={animate} alt="Loading animation" />
    </div>
  );
}
