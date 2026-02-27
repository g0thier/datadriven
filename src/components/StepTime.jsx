import { useEffect, useMemo, useState } from "react";
import { data } from "./StepTimeData.jsx";

// Transforme les étapes pour calculer les temps de début et de fin de chaque étape (en minutes)
function computeSteps(steps) {
  let t = 0;
  return steps.map((step) => {
    const stepStart = t;
    const stepEnd = t + step.duration;
    t = stepEnd;
    return { ...step, stepStart, stepEnd };
  });
}

// Formate un nombre de secondes en MM:SS
function formatMMSS(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

// Composant principal pour afficher le timer et les étapes
function StepTime() {
  const [startDate] = useState(() => new Date());
  const [elapsed, setElapsed] = useState(0); // secondes écoulées

  // Timer pour mettre à jour le temps écoulé chaque seconde
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const diffSeconds = Math.floor((now - startDate) / 1000);
      setElapsed(diffSeconds);
    }, 1000);

    return () => clearInterval(interval);
  }, [startDate]);

  // Pré-calcul des temps d'étapes (en minutes)
  const computedSteps = useMemo(() => computeSteps(data.steps), []);

  // calcule du temps total de l'atelier grace aux étapes (en minutes)
  const totalDuration = computedSteps.length > 0 ? computedSteps[computedSteps.length - 1].stepEnd : 0;

  // Temps restant (data.duration est en minutes)
  const totalSeconds = totalDuration * 60;
  const remainingSeconds = totalSeconds - elapsed;

  return (
    <>
      <aside className="fixed right-6.25 top-21 bottom-12 w-80 bg-white rounded-2xl shadow-md p-5 z-9999 flex flex-col">
        <h2 className="text-xl font-bold mb-4">Atelier de groupe</h2>

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
              <div className="text-sm text-gray-600 truncate">⏱ {totalDuration} minutes</div>
              <div className="text-sm text-gray-500 truncate">👥 {data.groupSize}</div>
            </div>
          </div>
        </div>

        {/* 2e cadre arrondi */}
        <div className="rounded-2xl border border-gray-100 p-4 flex flex-col flex-1 min-h-0">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold">Étapes de la séance</div>
          </div>

          {/* Liste des étapes */}
          <div className="flex flex-col gap-3 overflow-y-auto">
            {computedSteps.map((step, index) => {
              const elapsedMinutes = elapsed / 60;

              const isCurrent =
                elapsedMinutes >= step.stepStart &&
                elapsedMinutes < step.stepEnd;

              const isPast = elapsedMinutes >= step.stepEnd;

              const percentage =
                isCurrent
                  ? ((elapsedMinutes - step.stepStart) / step.duration) * 100
                  : isPast
                  ? 100
                  : 0;

              return (
                <div key={index} className="flex">

                  {/* Colonne timeline (puce + barre) */}
                  <div className="flex flex-col items-center w-6">
                    {/* Puce */}
                    <div
                      className={`w-3 h-3 rounded-full ${
                        isCurrent
                          ? "bg-violet-500"
                          : isPast
                          ? "bg-violet-300"
                          : "bg-gray-300"
                      }`}
                    />

                    {/* Barre verticale */}
                    {isCurrent ? (
                      <div className="w-1 flex-1 bg-gray-300 rounded-full mt-2 overflow-hidden">
                        <div
                          className="w-full bg-violet-500 transition-all duration-300"
                          style={{ height: `${percentage}%` }}
                        />
                      </div>
                    ): isPast ? (
                      <div className="w-1 flex-1 bg-violet-300 rounded-full mt-2" />
                    ) : (
                      <div className="w-1 flex-1 bg-gray-300 rounded-full mt-2" />
                    )}
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 pb-4 -mt-1.5">
                    <div className="font-medium">{step.label}</div>

                    {isCurrent ? (
                      <div className="text-sm text-gray-500">
                        {formatMMSS((step.stepEnd - elapsedMinutes) * 60)}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600">
                        {step.duration} min
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Puce et Fin */}
            <div className="flex -mt-0.5">
              {/* Colonne timeline */}
              <div className="flex flex-col items-center w-6">
                <div className="w-3 h-3 rounded-sm bg-gray-300"/>
              </div>

              {/* Contenu */}
              <div className="flex-1 pb-4 -mt-1.5">
                <div className="font-medium">
                  Fin dans {formatMMSS(remainingSeconds)}
                </div>
              </div>
            </div>

          </div>
        </div>
      </aside>
    </>
  );
}

export default StepTime;