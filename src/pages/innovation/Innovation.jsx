import Navbar from "../../components/Navbar.jsx";
import Cards from "../../components/innovation/Cards.jsx";
import SectionNavButtons from "../../components/SectionNavButtons.jsx";
import { innovationLinks } from "../../constants/navigationLinks.js";

function Innovation() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-200 py-12 px-6">
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
    </>
  );
}

export default Innovation;
