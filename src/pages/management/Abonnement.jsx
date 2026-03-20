import Navbar from "../../components/Navbar.jsx";
import SectionNavButtons from "../../components/SectionNavButtons.jsx";
import { managementLinks } from "../../constants/navigationLinks.js";
import Cards from "../../components/management/Cards.jsx";
import { PLANS } from "../../constants/managementPlans.js";

export default function Abonnement() {
  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-200 px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-4xl font-bold text-gray-800">Abonnement</h1>
            <SectionNavButtons
              links={managementLinks}
              ariaLabel="Navigation management"
              variant="page"
            />
          </div>

          <Cards plans={PLANS} />
        </div>
      </div>
    </>
  );
}
