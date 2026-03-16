import Navbar from "../../components/Navbar.jsx";
import SectionNavButtons from "../../components/SectionNavButtons.jsx";
import { managementLinks } from "../../constants/navigationLinks.js";

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

          <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
            <h2 className="text-2xl font-bold text-slate-900">Paiement de l'abonnement</h2>
            <p className="mt-2 text-sm text-slate-600">
              Cette section est prête pour ton futur design et l&apos;intégration du flow de paiement.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
