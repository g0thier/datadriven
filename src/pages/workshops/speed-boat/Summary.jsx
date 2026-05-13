import { useMemo, useState } from "react";
import WorkshopEmptyStateCard from "../../../components/workshops/WorkshopEmptyStateCard.jsx";
import WorkshopSummaryLayout from "../../../components/workshops/WorkshopSummaryLayout.jsx";
import WorkshopSyncErrorAlert from "../../../components/workshops/WorkshopSyncErrorAlert.jsx";
import {
  buildGridPosition,
  normalizePosition,
} from "../../../components/workshops/workshopBoardGeometry.js";

const EMPTY_ARRAY = Object.freeze([]);
const EMPTY_OBJECT = Object.freeze({});

function NotesDashboard({
  title,
  notes = EMPTY_ARRAY,
  votesByNote = EMPTY_OBJECT,
  currentParticipantId = "",
  showVotes = false,
  noteClassName = "bg-blue-100",
  emptyMessage = "",
}) {
  const [zoom, setZoom] = useState(50);
  const scale = zoom / 100;

  const notesWithDisplayPosition = useMemo(() => {
    return notes.map((note, index) => ({
      ...note,
      displayPosition: normalizePosition(note.position, buildGridPosition(index)),
    }));
  }, [notes]);

  const CANVAS_WIDTH = 2800;
  const CANVAS_HEIGHT = 1600;

  return (
    <div className="bg-white rounded-2xl shadow-md p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-600">{notes.length} notes</p>

        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 w-12 text-right">{zoom}%</span>

          <input
            type="range"
            min="20"
            max="100"
            step="5"
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="w-40 accent-slate-600"
            aria-label={`Zoom ${title}`}
          />
        </div>
      </div>

      {notes.length === 0 ? (
        <WorkshopEmptyStateCard message={emptyMessage} />
      ) : (
        <div className="w-full aspect-square overflow-auto rounded-xl border border-slate-200">
          <div
            className="relative origin-top-left"
            style={{
              width: CANVAS_WIDTH * scale,
              height: CANVAS_HEIGHT * scale,
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none opacity-30"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(15,23,42,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.08) 1px, transparent 1px)",
                backgroundSize: `${60 * scale}px ${60 * scale}px`,
              }}
            />

            {notesWithDisplayPosition.map((note) => {
              const stickerSet = votesByNote[note.id];
              const safeStickerSet = stickerSet instanceof Set ? stickerSet : null;
              const hasMine =
                safeStickerSet && currentParticipantId
                  ? safeStickerSet.has(currentParticipantId)
                  : false;
              const otherCount = Math.max(0, (safeStickerSet?.size || 0) - (hasMine ? 1 : 0));

              return (
                <div
                  key={note.id}
                  className="absolute select-none"
                  style={{
                    transform: `translate(${note.displayPosition.x * scale}px, ${
                      note.displayPosition.y * scale
                    }px) scale(${scale})`,
                    transformOrigin: "top left",
                    width: 260,
                  }}
                >
                  <div className={`relative rounded-lg shadow-md p-4 ${noteClassName}`}>
                    {showVotes && (
                      <div className="flex items-start justify-end gap-1 mb-2">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            hasMine ? "bg-green-500" : "bg-transparent border border-green-300"
                          }`}
                          title={hasMine ? "Ta gommette" : "Pas de gommette"}
                        />

                        {Array.from({ length: otherCount }).map((_, index) => (
                          <div
                            key={index}
                            className="w-3 h-3 rounded-full bg-blue-500"
                            title="Gommette d'un autre participant"
                          />
                        ))}
                      </div>
                    )}

                    <p className="text-gray-700 text-sm whitespace-pre-wrap">
                      {note.text || <span className="text-gray-400">—</span>}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SpeedBoatSummary({ sessionTitle, collaboration }) {
  const brakeNotes = Array.isArray(collaboration?.brakeNotes)
    ? collaboration.brakeNotes
    : EMPTY_ARRAY;
  const leverNotes = Array.isArray(collaboration?.leverNotes)
    ? collaboration.leverNotes
    : EMPTY_ARRAY;
  const votesByNote =
    collaboration?.votesByNote && typeof collaboration.votesByNote === "object"
      ? collaboration.votesByNote
      : EMPTY_OBJECT;
  const actionsByBrake =
    collaboration?.actionsByBrake && typeof collaboration.actionsByBrake === "object"
      ? collaboration.actionsByBrake
      : EMPTY_OBJECT;

  const currentParticipantId = collaboration?.participant?.id || "";
  const syncError = collaboration?.syncError || "";

  const challenge =
    String(collaboration?.description || "").trim() ||
    "Le défi n'a pas été renseigné pendant l'atelier.";
  const objective =
    String(collaboration?.step2Objective || "").trim() ||
    "L'objectif n'a pas été renseigné pendant l'atelier.";

  const rankedBrakes = useMemo(() => {
    return brakeNotes
      .map((note) => {
        const stickerSet = votesByNote[note.id];
        const voteCount = stickerSet instanceof Set ? stickerSet.size : 0;

        return {
          ...note,
          voteCount,
        };
      })
      .filter((note) => note.voteCount > 0)
      .sort((a, b) => {
        if (b.voteCount !== a.voteCount) {
          return b.voteCount - a.voteCount;
        }

        if (a.createdAt !== b.createdAt) {
          return String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
        }

        return String(a.id || "").localeCompare(String(b.id || ""));
      });
  }, [brakeNotes, votesByNote]);

  return (
    <WorkshopSummaryLayout sessionTitle={sessionTitle}>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">Sujet de l'atelier</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{challenge}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">
              Objectif
            </p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{objective}</p>
          </div>
        </div>

        <WorkshopSyncErrorAlert message={syncError} className="mb-4" />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-stretch">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-600 mb-2">
              Dashboard Freins
            </h2>

            <NotesDashboard
              title="Freins"
              notes={brakeNotes}
              votesByNote={votesByNote}
              currentParticipantId={currentParticipantId}
              showVotes
              noteClassName="bg-red-100"
              emptyMessage="Les freins apparaîtront ici dès qu'ils seront créés en étape 3."
            />
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-600 mb-2">
              Dashboard Leviers
            </h2>

            <NotesDashboard
              title="Leviers"
              notes={leverNotes}
              votesByNote={votesByNote}
              currentParticipantId={currentParticipantId}
              noteClassName="bg-blue-100"
              emptyMessage="Les leviers apparaîtront ici dès qu'ils seront créés en étape 5."
            />
          </section>
        </div>

        <div className="mt-6 bg-white rounded-2xl shadow-md p-6">
          <div className="mb-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">
              Freins priorisés et actions à mener
            </p>
          </div>

          {rankedBrakes.length === 0 ? (
            <div className="rounded-xl border border-slate-200 p-8 text-center text-gray-500">
              Aucun frein voté n'est disponible dans le plan d'action.
            </div>
          ) : (
            <div className="space-y-4">
              {rankedBrakes.map((brake, index) => {
                const actionText = String(actionsByBrake[brake.id] || "").trim();

                return (
                  <div key={brake.id} className="space-y-3">
                    <article className="rounded-xl border border-red-200 bg-red-50 p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <span className="text-xs uppercase tracking-wide text-red-700">
                          FREIN {index + 1}
                        </span>
                        <span className="text-xs text-gray-500">
                          {brake.voteCount} vote{brake.voteCount > 1 ? "s" : ""}
                        </span>
                      </div>

                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {brake.text || <span className="text-gray-400">—</span>}
                      </p>
                    </article>

                    <div className="ml-8 md:ml-12 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-emerald-700 mb-1">
                        Action à mener
                      </p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {actionText || <span className="text-gray-400">Aucune action rédigée.</span>}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
    </WorkshopSummaryLayout>
  );
}
