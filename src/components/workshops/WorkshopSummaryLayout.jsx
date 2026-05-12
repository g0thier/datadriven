/**
 * @module components/workshops/WorkshopSummaryLayout
 * @description Shared page layout for workshop summary screens.
 */

export default function WorkshopSummaryLayout({ sessionTitle, children }) {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-200 py-12 px-6">
      <div className="min-h-screen pr-86">
        <p className="text-sm uppercase tracking-wide text-gray-500 mb-2">Atelier terminé</p>
        <h1 className="text-4xl font-bold text-gray-800 mb-6">{sessionTitle}</h1>

        {children}
      </div>
    </div>
  );
}
