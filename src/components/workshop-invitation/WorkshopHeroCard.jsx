function WorkshopHeroCard({ atelier }) {
  return (
    <div className="relative rounded-2xl shadow-sm border border-slate-200 mb-6 overflow-hidden">
      {atelier?.image && (
        <img
          src={atelier.image}
          alt={atelier?.title ?? "Atelier"}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/20 to-transparent" />

      <div className="relative z-10 p-6 space-y-4">
        <div>
          <p className="text-xs text-white/80">Atelier sélectionné</p>
          <h2 className="text-white text-2xl font-bold leading-tight">
            {atelier?.title ?? "Atelier"}
          </h2>
        </div>

        {(atelier?.duration || atelier?.groupSize) && (
          <div className="flex flex-wrap gap-2">
            {atelier?.duration && (
              <span className="inline-flex items-center gap-2 rounded-full bg-white text-slate-700 px-3 py-1 text-sm">
                ⏱ {atelier.duration}
              </span>
            )}
            {atelier?.groupSize && (
              <span className="inline-flex items-center gap-2 rounded-full bg-white text-slate-700 px-3 py-1 text-sm">
                👥 {atelier.groupSize}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default WorkshopHeroCard;
