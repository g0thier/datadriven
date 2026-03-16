import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import MaterialIcon from "../../components/MaterialIcon.jsx";
import Navbar from "../../components/Navbar.jsx";
import SectionNavButtons from "../../components/SectionNavButtons.jsx";
import { innovationLinks } from "../../constants/navigationLinks.js";
import { auth, onAuthStateChangedListener, subscribeUserWorkshopSessions } from "../../firebase";

const STATUS_LABELS = {
  scheduled: "Planifié",
  completed: "Terminé",
  cancelled: "Annulé",
};

const toTimestamp = (value) => {
  const time = new Date(String(value || "")).getTime();
  return Number.isFinite(time) ? time : null;
};

const formatDateTime = (value) => {
  const timestamp = toTimestamp(value);
  if (timestamp === null) return "Date à confirmer";

  return new Date(timestamp).toLocaleString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusLabel = (status) => STATUS_LABELS[status] || "Planifié";

const sortUpcoming = (a, b) => {
  const aTs = toTimestamp(a.workshopDateTime);
  const bTs = toTimestamp(b.workshopDateTime);
  if (aTs === null && bTs === null) return 0;
  if (aTs === null) return 1;
  if (bTs === null) return -1;
  return aTs - bTs;
};

const sortPast = (a, b) => {
  const aTs = toTimestamp(a.workshopDateTime);
  const bTs = toTimestamp(b.workshopDateTime);
  if (aTs === null && bTs === null) return 0;
  if (aTs === null) return 1;
  if (bTs === null) return -1;
  return bTs - aTs;
};

function EventCard({ event, isPast }) {
  const canOpen = Boolean(event.workshopId) && Boolean(event.sessionId);
  const route = canOpen
    ? `/innovation/${encodeURIComponent(event.workshopId)}/${encodeURIComponent(event.sessionId)}`
    : "";

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">
            {event.workshopTitle || "Atelier"}
          </h3>
          <p className="mt-1 text-sm text-slate-500">{formatDateTime(event.workshopDateTime)}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          {getStatusLabel(event.status)}
        </span>
      </div>

      {canOpen ? (
        <Link
          to={route}
          className={`inline-flex items-center gap-2 rounded-lg 
            ${isPast ? "bg-violet-300" : "bg-amber-300" } 
            px-3 py-2 text-sm font-semibold text-slate-900 transition 
            ${isPast ? "hover:bg-violet-400" : "hover:bg-amber-400" }`}
        >
          <MaterialIcon name={isPast ? "visibility" : "play_arrow"} size={18} />
          {isPast ? "Voir le résumé" : "Rejoindre l'atelier"}
        </Link>
      ) : (
        <p className="text-sm text-slate-500">Lien indisponible.</p>
      )}
    </article>
  );
}

export default function MyEvents() {
  const [uid, setUid] = useState(() => auth.currentUser?.uid || "");
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(() => Boolean(auth.currentUser?.uid));
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const unsubscribe = onAuthStateChangedListener((currentUser) => {
      const nextUid = currentUser?.uid || "";
      setUid(nextUid);

      if (!nextUid) {
        setSessions([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!uid) return () => {};

    const unsubscribe = subscribeUserWorkshopSessions(uid, (nextSessions) => {
      setSessions(nextSessions);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [uid]);

  useEffect(() => {
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 30 * 1000);

    return () => clearInterval(interval);
  }, []);

  const { upcomingEvents, pastEvents } = useMemo(() => {
    const upcoming = [];
    const past = [];

    sessions.forEach((session) => {
      const eventTime = toTimestamp(session.workshopDateTime);
      if (eventTime !== null && eventTime < nowMs) {
        past.push(session);
        return;
      }
      upcoming.push(session);
    });

    upcoming.sort(sortUpcoming);
    past.sort(sortPast);

    return { upcomingEvents: upcoming, pastEvents: past };
  }, [sessions, nowMs]);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-200 px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-4xl font-bold text-gray-800">Mes événements</h1>
            <SectionNavButtons
              links={innovationLinks}
              ariaLabel="Navigation innovation"
              variant="page"
            />
          </div>
          <p className="mb-8 text-sm text-slate-600">
            Retrouve ici tes ateliers passés et à venir.
          </p>

          {isLoading ? (
            <p className="rounded-xl bg-white p-4 text-sm text-slate-600 shadow-sm">
              Chargement des événements...
            </p>
          ) : (
            <div className="space-y-10">
              <section>
                <div className="mb-4 flex items-center gap-2">
                  <MaterialIcon name="event_upcoming" size={20} />
                  <h2 className="text-xl font-semibold text-slate-800">
                    Ateliers à venir ({upcomingEvents.length})
                  </h2>
                </div>
                {upcomingEvents.length === 0 ? (
                  <p className="rounded-xl bg-white p-4 text-sm text-slate-600 shadow-sm">
                    Aucun atelier à venir.
                  </p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {upcomingEvents.map((event) => (
                      <EventCard key={event.sessionId || event.id} event={event} isPast={false} />
                    ))}
                  </div>
                )}
              </section>

              <section>
                <div className="mb-4 flex items-center gap-2">
                  <MaterialIcon name="history" size={20} />
                  <h2 className="text-xl font-semibold text-slate-800">
                    Ateliers passés ({pastEvents.length})
                  </h2>
                </div>
                {pastEvents.length === 0 ? (
                  <p className="rounded-xl bg-white p-4 text-sm text-slate-600 shadow-sm">
                    Aucun atelier passé.
                  </p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {pastEvents.map((event) => (
                      <EventCard key={event.sessionId || event.id} event={event} isPast />
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
