import { useMemo, useState } from "react";
import { data } from "./StepTimeData.jsx";


function StepTime() {
  const [startDate] = useState(() => new Date());
  const [elapsed, setElapsed] = useState(0);
  
  // remplace pour le temps restant de data.duration - elapsed
  const elapsedTime = useMemo(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const diff = Math.floor((now - startDate) / 1000); // Temps écoulé en secondes
      setElapsed(diff);
    }, 1000);
    return () => clearInterval(interval); // Nettoie l'intervalle à la fin
  }, [startDate]);


  return (
    <>
      <aside className="fixed right-6.25 top-21 bottom-12 w-80 bg-white rounded-2xl shadow-md p-5 z-9999 flex flex-col">
        <h2 className="text-xl font-bold mb-4">Atelier en groupe</h2>

        {/* 1er cadre arrondi */}
        <div className="rounded-2xl border border-gray-100 p-4 mb-4">
          <div className="flex items-center gap-3">
            <img
              src={data.image}
              alt="Profil"
              className="w-14 h-14 rounded-lg object-cover"  
            />
            <div className="min-w-0">
              <div className="font-semibold truncate">{data.title}</div>
              <div className="text-sm text-gray-600 truncate">⏱ {data.duration} minutes</div>
              <div className="text-sm text-gray-500 truncate">👥 {data.groupSize}</div>
            </div>
          </div>
        </div>

        {/* 2e cadre arrondi */}
        <div className="rounded-2xl border border-gray-100 p-4 mb-4 flex items-center justify-center">
          <div className="text-2xl font-bold">{`${Math.floor((data.duration * 60 - elapsed) / 60)
            .toString()
            .padStart(2, "0")}:${((data.duration * 60 - elapsed) % 60).toString().padStart(2, "0")}`}</div>
        </div>

        {/* 3e cadre arrondi */}
        <div className="rounded-2xl border border-gray-100 p-4 flex flex-col flex-1 min-h-0">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold">Étapes de la séance</div>
          </div>

          {/* Liste des étapes*/}
          <div className="flex flex-col gap-3 overflow-y-auto">
            {data.steps.map((step, index) => {
              const stepStart = data.steps.slice(0, index).reduce((acc, s) => acc + s.duration, 0);
              const stepEnd = stepStart + step.duration;
              const isCurrent = elapsed >= stepStart && elapsed < stepEnd;
              const isPast = elapsed >= stepEnd;

              return (
                <div key={index} className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      isCurrent ? "bg-violet-500" : isPast ? "bg-violet-300" : "bg-gray-300"
                    }`}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{step.label}</div>
                    <div className="text-sm text-gray-600">{step.duration} min</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
}

export default StepTime;