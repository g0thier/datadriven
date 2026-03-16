import Navbar from "../components/Navbar.jsx";
import SectionNavButtons from "../components/SectionNavButtons.jsx";
import { soonLinks } from "../constants/navigationLinks.js";

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
