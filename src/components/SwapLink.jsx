/**
 * @module components/SwapLink
 * @description UI component module for SwapLink.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */
import { NavLink } from "react-router-dom";

/**
 * Renders the SwapLink component.
 * @param {Object} props - Component props.
 * @param {string} [props.to="#"] - to prop.
 * @param {*} props.part1 - part1 prop.
 * @param {*} props.part2 - part2 prop.
 * @param {string} [props.align="left"] - align prop.
 * @returns {JSX.Element|null} Rendered component output.
 *
 * @example
 * import SwapLink from "../components/SwapLink";
 *
 * // Real usage reference: src/pages/auth/RegisterCompany.jsx
 * <SwapLink />;
 */
function SwapLink({ to = "#", part1, part2, align = "left" }) {
  const alignmentClasses = {
    left: "justify-start text-left",
    center: "justify-center text-center",
    right: "justify-end text-right",
  };

  return (
    <NavLink to={to} className="group inline-block text-sm text-indigo-500">
      <span className="relative inline-block align-middle w-full">
        <span className="invisible whitespace-nowrap">
          {part1.length > part2.length ? part1 : part2}
        </span>

        <span
          className={`
            absolute inset-0
            overflow-hidden
            h-[1.25em] leading-[1.25em]
            flex items-center
            ${alignmentClasses[align]}
          `}
        >
          <span
            className="
              absolute
              transition-all duration-300 ease-in-out
              group-hover:-translate-y-full
              group-hover:opacity-0
              whitespace-nowrap
            "
          >
            {part1}
          </span>

          <span
            className="
              absolute
              translate-y-full opacity-0
              transition-all duration-300 ease-in-out
              group-hover:translate-y-0
              group-hover:opacity-100
              whitespace-nowrap
            "
          >
            {part2}
          </span>
        </span>
      </span>
    </NavLink>
  );
}

export default SwapLink;