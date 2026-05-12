/**
 * @module workshops/world-coffee/steps/Step2
 * @description World Cafe step 2 screen for assigning one facilitator per description.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import { useMemo } from "react";
import WorkshopStepLayout from "../../WorkshopStepLayout.jsx";

const EMPTY_ARRAY = Object.freeze([]);
const EMPTY_OBJECT = Object.freeze({});

const buildInitialsFromName = (value = "") => {
  const tokens = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (tokens.length === 0) return "";
  if (tokens.length === 1) {
    return tokens[0].slice(0, 2).toUpperCase();
  }

  return `${tokens[0][0] || ""}${tokens[1][0] || ""}`.toUpperCase();
};

const getParticipantDisplayName = (participant = {}) => {
  const firstName = String(participant?.firstName || "").trim();
  const lastName = String(participant?.lastName || "").trim();
  const fullName = `${firstName} ${lastName}`.trim();

  return (
    fullName ||
    String(participant?.name || "").trim() ||
    String(participant?.label || "").trim() ||
    String(participant?.email || "").trim() ||
    "Participant"
  );
};

const getParticipantInitials = (participant = {}) => {
  const firstName = String(participant?.firstName || "").trim();
  const lastName = String(participant?.lastName || "").trim();
  const fromNames = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase();

  if (fromNames.trim()) {
    return fromNames;
  }

  const displayName = getParticipantDisplayName(participant);
  const fallbackInitials = buildInitialsFromName(displayName);
  if (fallbackInitials) return fallbackInitials;

  const participantId = String(participant?.id || "");
  const suffix = participantId.slice(-2).toUpperCase();
  return suffix || "P";
};

/**
 * Renders World Cafe step 2 (facilitator assignment).
 *
 * @param {Object} props - Component props.
 * @param {Object} props.step - Step metadata.
 * @param {string} props.sessionTitle - Current session title.
 * @param {Object} props.collaboration - Collaboration state and actions.
 * @returns {JSX.Element} The rendered step 2 screen.
 */
export default function Step2({ step, sessionTitle, collaboration }) {
  const descriptions = Array.isArray(collaboration?.descriptions)
    ? collaboration.descriptions
    : EMPTY_ARRAY;
  const participants = Array.isArray(collaboration?.participants)
    ? collaboration.participants
    : EMPTY_ARRAY;
  const facilitatorByDescriptionId =
    collaboration?.facilitatorByDescriptionId &&
    typeof collaboration.facilitatorByDescriptionId === "object"
      ? collaboration.facilitatorByDescriptionId
      : EMPTY_OBJECT;

  const hasUnassignedDescriptions = Boolean(collaboration?.hasUnassignedDescriptions);
  const isLoading = Boolean(collaboration?.isLoading);
  const syncError = collaboration?.syncError || "";

  const participantById = useMemo(() => {
    return participants.reduce((accumulator, participant) => {
      const participantId = String(participant?.id || "").trim();
      if (!participantId) return accumulator;

      accumulator[participantId] = participant;
      return accumulator;
    }, {});
  }, [participants]);

  const assignedFacilitatorIds = useMemo(() => {
    return new Set(
      Object.values(facilitatorByDescriptionId)
        .map((participantId) => String(participantId || "").trim())
        .filter(Boolean)
    );
  }, [facilitatorByDescriptionId]);

  return (
    <WorkshopStepLayout title={sessionTitle} stepLabel={step.label} description={step.description}>
      {!!syncError && (
        <p className="mb-3 text-sm text-red-600" role="alert">
          {syncError}
        </p>
      )}

      {descriptions.length > 0 && hasUnassignedDescriptions && (
        <p className="mb-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
          Si un sujet n&apos;a pas de facilitateur, il ne sera pas traité dans les étapes suivantes.
        </p>
      )}

      {descriptions.length === 0 ? (
        <div className="rounded-2xl bg-white shadow-md p-8 text-center text-gray-500">
          Aucun sujet disponible pour le moment.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-md p-6">
          <ul className="list-disc pl-5 space-y-4 marker:text-gray-400">
            {descriptions.map((description) => {
              const facilitatorId = String(facilitatorByDescriptionId[description.id] || "").trim();
              const facilitator = facilitatorId
                ? participantById[facilitatorId] || {
                    id: facilitatorId,
                    name:
                      collaboration?.getParticipantLabel?.(facilitatorId) || "Participant",
                  }
                : null;

              const availableParticipants = participants.filter((participant) => {
                const participantId = String(participant?.id || "").trim();
                if (!participantId) return false;
                return !assignedFacilitatorIds.has(participantId);
              });

              return (
                <li key={description.id} className="text-sm text-gray-700">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-gray-700 text-sm whitespace-pre-wrap flex-1">
                        {description.text || <span className="text-gray-400">-</span>}
                      </p>

                      {facilitator ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (isLoading) return;
                            collaboration?.actions?.clearFacilitator?.(description.id);
                          }}
                          className="shrink-0 rounded-full border border-violet-200 bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-200 transition"
                          aria-label={`Retirer ${getParticipantDisplayName(facilitator)} de ce sujet`}
                          title={`Retirer ${getParticipantDisplayName(facilitator)} de ce sujet`}
                        >
                          {getParticipantInitials(facilitator)}
                        </button>
                      ) : (
                        <span className="shrink-0 text-xs text-gray-400">Aucun facilitateur</span>
                      )}
                    </div>

                    <div className="mt-3 overflow-x-auto">
                      <div className="flex items-center gap-2 w-max whitespace-nowrap">
                        {availableParticipants.length === 0 ? (
                          <span className="text-xs text-gray-400 px-1">
                            Aucun participant disponible.
                          </span>
                        ) : (
                          availableParticipants.map((participant) => {
                            const participantId = String(participant?.id || "").trim();
                            const participantName = getParticipantDisplayName(participant);

                            return (
                              <button
                                key={participantId}
                                type="button"
                                onClick={() => {
                                  if (isLoading) return;
                                  collaboration?.actions?.setFacilitator?.(
                                    description.id,
                                    participantId
                                  );
                                }}
                                className="shrink-0 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:border-violet-300 hover:text-violet-700 transition"
                                aria-label={`Affecter ${participantName} à ce sujet`}
                                title={participantName}
                              >
                                {getParticipantInitials(participant)}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </WorkshopStepLayout>
  );
}
