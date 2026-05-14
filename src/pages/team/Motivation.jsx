/**
 * @module pages/team/Motivation
 * @description Minimal motivation page placeholder for team section.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */
import Navbar from "../../components/Navbar.jsx";
import SectionNavButtons from "../../components/SectionNavButtons.jsx";
import { teamLinks } from "../../constants/navigationLinks.js";

/**
 * Renders the Motivation page.
 * @returns {JSX.Element} The rendered page layout.
 *
 * @example
 * import { lazy } from "react";
 * const Motivation = lazy(() => import("./pages/team/Motivation.jsx"));
 *
 * // Real usage reference: src/App.jsx
 * <Route path="/team/motivation" element={<Motivation />} />;
 */
export default function Motivation() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-200 py-12 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-4xl font-bold text-gray-800">Motivation</h1>
            <SectionNavButtons
              links={teamLinks}
              ariaLabel="Navigation motivation"
              variant="page"
            />
          </div>

          <p className="text-base text-gray-700">
            Cette section arrive bientôt. Vous pourrez y retrouver des contenus et actions
            dédiés à la motivation des équipes.
          </p>
        </div>
      </div>
    </>
  );
}
