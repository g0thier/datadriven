/**
 * @module pages/team/QuizInvitationDetail
 * @description Quiz invitation landing page loaded from email links.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../../components/Navbar.jsx";
import SectionNavButtons from "../../components/SectionNavButtons.jsx";
import { teamLinks } from "../../constants/navigationLinks.js";
import {
  auth,
  onAuthStateChangedListener,
  subscribeUserQuizInvitation,
} from "../../firebase";

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

const normalizeParam = (value) => String(value || "").trim();

export default function QuizInvitationDetail() {
  const { quizId: quizIdParamRaw, invitationId: invitationIdParamRaw } = useParams();
  const quizIdParam = useMemo(() => normalizeParam(quizIdParamRaw), [quizIdParamRaw]);
  const invitationIdParam = useMemo(
    () => normalizeParam(invitationIdParamRaw),
    [invitationIdParamRaw]
  );

  const [uid, setUid] = useState(() => auth.currentUser?.uid || "");
  const [invitation, setInvitation] = useState(null);
  const [isLoading, setIsLoading] = useState(() => Boolean(auth.currentUser?.uid));
  const [loadError, setLoadError] = useState("");
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
        setInvitation(null);
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
    if (!uid || !invitationIdParam) return () => {};

    const unsubscribe = subscribeUserQuizInvitation(
      uid,
      invitationIdParam,
      (nextInvitation) => {
        setInvitation(nextInvitation);
        setLoadError("");
        setIsLoading(false);
      },
      () => {
        setInvitation(null);
        setLoadError("Impossible de charger l'invitation quiz pour le moment.");
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [invitationIdParam, uid]);

  const hasQuizMismatch =
    Boolean(invitation) &&
    Boolean(quizIdParam) &&
    Boolean(invitation.quizId) &&
    invitation.quizId !== quizIdParam;

  const handleTemporaryCta = () => {
    alert("Le lancement du quiz depuis ce lien sera disponible bientôt.");
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-200 py-12 px-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-4xl font-bold text-gray-800">Invitation Quiz</h1>
            <SectionNavButtons links={teamLinks} ariaLabel="Navigation motivation" variant="page" />
          </div>

          {isLoading ? (
            <p className="rounded-xl bg-white p-4 text-sm text-slate-600 shadow-sm">
              Chargement de l'invitation...
            </p>
          ) : loadError ? (
            <p className="rounded-xl bg-white p-4 text-sm text-red-600 shadow-sm">{loadError}</p>
          ) : !invitation ? (
            <p className="rounded-xl bg-white p-4 text-sm text-slate-600 shadow-sm">
              Invitation introuvable.
            </p>
          ) : hasQuizMismatch ? (
            <p className="rounded-xl bg-white p-4 text-sm text-red-600 shadow-sm">
              Le lien n'est pas cohérent avec ce quiz.
            </p>
          ) : (
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Invitation reçue</p>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                {invitation.quizTitle || "Quiz motivation"}
              </h2>

              <div className="grid gap-4 sm:grid-cols-3 mb-6">
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                  <p className="text-xs text-slate-500">Quiz ID</p>
                  <p className="text-sm font-semibold text-slate-900 break-all">
                    {invitation.quizId || "N/A"}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                  <p className="text-xs text-slate-500">Invitation ID</p>
                  <p className="text-sm font-semibold text-slate-900 break-all">
                    {invitation.invitationId || invitationIdParam}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                  <p className="text-xs text-slate-500">Statut</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {invitation.status || "invited"}
                  </p>
                </div>
              </div>

              <p className="text-slate-700 mb-6">
                Date limite de réponse:{" "}
                <span className="font-semibold">{formatDateTime(invitation.responseDeadline)}</span>
              </p>

              <button
                type="button"
                onClick={handleTemporaryCta}
                className="inline-flex items-center rounded-lg bg-amber-300 hover:bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-900 transition"
              >
                Commencer le quiz (bientôt disponible)
              </button>
            </article>
          )}
        </div>
      </div>
    </>
  );
}
