/**
 * @module pages/Soon
 * @description Placeholder page for upcoming application sections.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */
import Navbar from "../components/Navbar.jsx";
import SectionNavButtons from "../components/SectionNavButtons.jsx";
import { soonLinks } from "../constants/navigationLinks.js";

/**
 * Renders the Soon page.
 * @returns {JSX.Element} The rendered page layout.
 *
 * @example
 * import { lazy } from "react";
 * const Soon = lazy(() => import("./pages/Soon.jsx"));
 *
 * // Real usage reference: src/App.jsx
 * <Route path="/soon" element={<Soon />} />;
 */
export default function Soon() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-200 py-12 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-4xl font-bold text-gray-800">À venir</h1>
            <SectionNavButtons
              links={soonLinks}
              ariaLabel="Navigation sections principales"
              variant="page"
            />
          </div>
        </div>
      </div>
    </>
  );
}
