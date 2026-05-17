/**
 * @module components/workshops/WorkshopSummaryLayout
 * @description Shared page layout for workshop summary screens.
 */
import Navbar from "../Navbar.jsx";
import SectionNavButtons from "../SectionNavButtons.jsx";
import { innovationLinks } from "../../constants/navigationLinks.js";

export default function WorkshopSummaryLayout({ sessionTitle, children }) {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-200 px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-4xl font-bold text-gray-800">{sessionTitle}</h1>
            <div className="invisible pointer-events-none">
              <SectionNavButtons
                links={innovationLinks}
                ariaLabel="Navigation innovation"
                variant="page"
              />
            </div>
          </div>

          {children}
        </div>
      </div>
    </>
  );
}
