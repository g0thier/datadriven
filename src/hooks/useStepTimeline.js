import { useEffect, useMemo, useState } from "react";

// Transforme les étapes pour calculer les temps de début et de fin (en minutes)
function computeSteps(steps) {
  let t = 0;
  return steps.map((step) => {
    const stepStart = t;
    const stepEnd = t + step.duration;
    t = stepEnd;
    return { ...step, stepStart, stepEnd };
  });
}

export function useStepTimeline(sessionData, startAt) {
  const startDate = useMemo(() => {
    const d = startAt instanceof Date ? startAt : new Date(startAt);
    return Number.isNaN(d.getTime()) ? new Date() : d;
  }, [startAt]);

  const [elapsedSeconds, setElapsedSeconds] = useState(() => {
    const now = new Date();
    return Math.max(0, Math.floor((now - startDate) / 1000));
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setElapsedSeconds(Math.max(0, Math.floor((now - startDate) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [startDate]);

  const computedSteps = useMemo(
    () => computeSteps(sessionData.steps ?? []),
    [sessionData.steps]
  );

  const totalDuration =
    computedSteps.length > 0 ? computedSteps[computedSteps.length - 1].stepEnd : 0;

  const elapsedMinutes = elapsedSeconds / 60;
  const totalSeconds = totalDuration * 60;
  const remainingSeconds = totalSeconds - elapsedSeconds;

  const currentIndex = useMemo(() => {
    if (!computedSteps.length) return -1;
    // si fini, renvoie last index (ou -1 si tu préfères)
    if (elapsedMinutes >= totalDuration) return computedSteps.length - 1;

    return computedSteps.findIndex(
      (s) => elapsedMinutes >= s.stepStart && elapsedMinutes < s.stepEnd
    );
  }, [computedSteps, elapsedMinutes, totalDuration]);

  const currentStep = currentIndex >= 0 ? computedSteps[currentIndex] : null;

  return {
    startDate,
    elapsedSeconds,
    elapsedMinutes,
    computedSteps,
    totalDuration,
    totalSeconds,
    remainingSeconds,
    currentIndex,
    currentStep,
    isFinished: elapsedSeconds >= totalSeconds,
  };
}