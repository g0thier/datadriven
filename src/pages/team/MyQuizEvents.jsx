/**
 * @module pages/team/MyQuizEvents
 * @description Events page showing upcoming and past quizzes for the current user.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */
import { useEffect, useMemo, useRef, useState } from "react";
import MaterialIcon from "../../components/MaterialIcon.jsx";
import Navbar from "../../components/Navbar.jsx";
import SectionNavButtons from "../../components/SectionNavButtons.jsx";
import { teamLinks } from "../../constants/navigationLinks.js";
import { auth, onAuthStateChangedListener, subscribeUserQuizInvitations } from "../../firebase";

const toTimestamp = (value) => {
  const time = new Date(String(value || "")).getTime();
  return Number.isFinite(time) ? time : null;
};

const formatDateTime = (value) => {
  const timestamp = toTimestamp(value);
  if (timestamp === null) return "Date limite à confirmer";

  return new Date(timestamp).toLocaleString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const sortUpcoming = (a, b) => {
  const aTs = toTimestamp(a.responseDeadline);
  const bTs = toTimestamp(b.responseDeadline);
  if (aTs === null && bTs === null) return 0;
  if (aTs === null) return 1;
  if (bTs === null) return -1;
  return aTs - bTs;
};

const sortPast = (a, b) => {
  const aTs = toTimestamp(a.responseDeadline);
  const bTs = toTimestamp(b.responseDeadline);
  if (aTs === null && bTs === null) return 0;
  if (aTs === null) return 1;
  if (bTs === null) return -1;
  return bTs - aTs;
};

function QuizCard({ quiz, isPast }) {
  const handleOpenAlert = () => {
    alert(
      [
        `Quiz: ${quiz.quizTitle || "Quiz motivation"}`,
        `Invitation ID: ${quiz.invitationId || quiz.id || "N/A"}`,
        `Deadline: ${quiz.responseDeadline || "Non renseignée"}`,
        `Statut: ${quiz.status || "invited"}`,
      ].join("\n")
    );
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">{quiz.quizTitle || "Quiz"}</h3>
          <p className="mt-1 text-sm text-slate-500">
            Date limite: {formatDateTime(quiz.responseDeadline)}
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          {isPast ? "Passé" : "À venir"}
        </span>
      </div>

      <button
        type="button"
        onClick={handleOpenAlert}
        className={`inline-flex items-center gap-2 rounded-lg 
          ${isPast ? "bg-violet-300" : "bg-amber-300"} 
          px-3 py-2 text-sm font-semibold text-slate-900 transition 
          ${isPast ? "hover:bg-violet-400" : "hover:bg-amber-400"}`}
      >
        <MaterialIcon name={isPast ? "visibility" : "info"} size={18} />
        {isPast ? "Voir les informations" : "Voir les informations"}
      </button>
    </article>
  );
}

/**
 * Renders the MyQuizEvents page.
 * @returns {JSX.Element} The rendered page layout.
 */
export default function MyQuizEvents() {
  const [uid, setUid] = useState(() => auth.currentUser?.uid || "");
  const [quizInvitations, setQuizInvitations] = useState([]);
  const [isLoading, setIsLoading] = useState(() => Boolean(auth.currentUser?.uid));
  const [loadError, setLoadError] = useState("");
  const [snapshotNowMs, setSnapshotNowMs] = useState(() => Date.now());
  const uidRef = useRef(uid);

  useEffect(() => {
    uidRef.current = uid;
  }, [uid]);

  useEffect(() => {
    const unsubscribe = onAuthStateChangedListener((currentUser) => {
      const nextUid = currentUser?.uid || "";
      const hasUidChanged = uidRef.current !== nextUid;
      uidRef.current = nextUid;
      setUid(nextUid);

      if (!nextUid) {
        setQuizInvitations([]);
        setLoadError("");
        setIsLoading(false);
        return;
      }

      if (hasUidChanged) {
        setLoadError("");
        setIsLoading(true);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!uid) return () => {};

    const unsubscribe = subscribeUserQuizInvitations(
      uid,
      (nextInvitations) => {
        setQuizInvitations(nextInvitations);
        setSnapshotNowMs(Date.now());
        setLoadError("");
        setIsLoading(false);
      },
      () => {
        setQuizInvitations([]);
        setLoadError("Impossible de charger les quiz pour le moment.");
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [uid]);

  const { upcomingQuiz, pastQuiz } = useMemo(() => {
    const upcoming = [];
    const past = [];

    quizInvitations.forEach((quiz) => {
      const deadlineTs = toTimestamp(quiz.responseDeadline);
      if (deadlineTs !== null && deadlineTs < snapshotNowMs) {
        past.push(quiz);
        return;
      }

      upcoming.push(quiz);
    });

    upcoming.sort(sortUpcoming);
    past.sort(sortPast);

    return { upcomingQuiz: upcoming, pastQuiz: past };
  }, [quizInvitations, snapshotNowMs]);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-200 px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-4xl font-bold text-gray-800">Mes quiz</h1>
            <SectionNavButtons links={teamLinks} ariaLabel="Navigation team" variant="page" />
          </div>
          <p className="mb-8 text-sm text-slate-600">
            Retrouve ici tes quiz passés et à venir.
          </p>

          {isLoading ? (
            <p className="rounded-xl bg-white p-4 text-sm text-slate-600 shadow-sm">
              Chargement des quiz...
            </p>
          ) : loadError ? (
            <p className="rounded-xl bg-white p-4 text-sm text-red-600 shadow-sm">{loadError}</p>
          ) : (
            <div className="space-y-10">
              <section>
                <div className="mb-4 flex items-center gap-2">
                  <MaterialIcon name="event_upcoming" size={20} />
                  <h2 className="text-xl font-semibold text-slate-800">
                    Quiz à venir ({upcomingQuiz.length})
                  </h2>
                </div>
                {upcomingQuiz.length === 0 ? (
                  <p className="rounded-xl bg-white p-4 text-sm text-slate-600 shadow-sm">
                    Aucun quiz à venir.
                  </p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {upcomingQuiz.map((quiz) => (
                      <QuizCard key={quiz.invitationId || quiz.id} quiz={quiz} isPast={false} />
                    ))}
                  </div>
                )}
              </section>

              <section>
                <div className="mb-4 flex items-center gap-2">
                  <MaterialIcon name="history" size={20} />
                  <h2 className="text-xl font-semibold text-slate-800">
                    Quiz passés ({pastQuiz.length})
                  </h2>
                </div>
                {pastQuiz.length === 0 ? (
                  <p className="rounded-xl bg-white p-4 text-sm text-slate-600 shadow-sm">
                    Aucun quiz passé.
                  </p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {pastQuiz.map((quiz) => (
                      <QuizCard key={quiz.invitationId || quiz.id} quiz={quiz} isPast />
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
