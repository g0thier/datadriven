import animate from "../../assets/animate.svg";
import "./RouteFallback.css";

export default function RouteFallback() {
  return (
    <div className="route-fallback">
      <img src={animate} alt="Loading animation" />
    </div>
  );
}