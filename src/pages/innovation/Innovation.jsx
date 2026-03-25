/**
 * @module pages/innovation/Innovation
 * @description Innovation landing page listing available workshop cards.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */
import Navbar from "../../components/Navbar.jsx";
import Cards from "../../components/innovation/Cards.jsx";
import SectionNavButtons from "../../components/SectionNavButtons.jsx";
import { innovationLinks } from "../../constants/navigationLinks.js";

/**
 * Renders the Innovation page.
 * @returns {JSX.Element} The rendered page layout.
 *
 * @example
 * import { lazy } from "react";
 * const Innovation = lazy(() => import("./pages/innovation/Innovation.jsx"));
 *
 * // Real usage reference: src/App.jsx
 * <Route path="/innovation/ateliers" element={<Innovation />} />;
 */
function Innovation() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-200 py-12 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-4xl font-bold text-gray-800">Innovation & Créativité</h1>
            <SectionNavButtons
              links={innovationLinks}
              ariaLabel="Navigation innovation"
              variant="page"
            />
          </div>
          <Cards />
        </div>
      </div>
    </>
  );
}

export default Innovation;
