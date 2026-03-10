/**
 * @module components/MaterialIcon
 * @description Reusable component to render Google Material Symbols icons with configurable visual variations.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 * @see https://fonts.google.com/icons
 */

/**
 * Displays a Material Symbols icon.
 * Requires the Material Symbols font stylesheet in `index.html`:
 * `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" />`
 *
 * @param {Object} props - Component props.
 * @param {string} props.name - Material icon name (for example: "home", "arrow_back").
 * @param {number} [props.size=24] - Icon size in pixels and optical size (`opsz`).
 * @param {number} [props.weight=400] - Icon weight (`wght`) from 100 to 700.
 * @param {number} [props.fill=0] - Fill mode (`FILL`), usually `0` (outline) or `1` (filled).
 * @param {number} [props.grad=0] - Grade (`GRAD`), usually from -25 to 200.
 * @param {string} [props.className=""] - Additional CSS classes.
 * @returns {JSX.Element} A span rendering the requested Material Symbol icon.
 *
 * @example
 * import MaterialIcon from "../components/MaterialIcon";
 *
 * function App() {
 *   return (
 *     <div>
 *       <MaterialIcon name="arrow_back" />
 *       <MaterialIcon name="home" size={32} />
 *       <MaterialIcon name="favorite" fill={1} weight={700} />
 *     </div>
 *   );
 * }
 *
 * export default App;
 */
export default function MaterialIcon({
  name,
  size = 24,
  weight = 400,
  fill = 0,
  grad = 0,
  className = ""
}) {
  const style = {
    fontVariationSettings: `
      'FILL' ${fill},
      'wght' ${weight},
      'GRAD' ${grad},
      'opsz' ${size}
    `,
    fontSize: size
  };

  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={style}
    >
      {name}
    </span>
  );
}
