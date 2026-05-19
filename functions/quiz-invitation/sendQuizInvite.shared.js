function normalizeText(value) {
  return String(value || "").trim();
}

function toPositiveInteger(value, fallback = 14) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;

  const floored = Math.floor(numeric);
  if (floored < 1) return 1;
  return floored;
}

function toBoolean(value) {
  if (value === true) return true;
  if (value === false) return false;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }
  if (typeof value === "number") return value === 1;
  return false;
}

function validateQuizInvitePayload(payload = {}) {
  const inviteeEmail = normalizeText(payload.inviteeEmail);
  const inviteeName = normalizeText(payload.inviteeName) || "Trucmuche";
  const inviterFirstName = normalizeText(payload.inviterFirstName);
  const inviterLastName = normalizeText(payload.inviterLastName);
  const inviterEmail = normalizeText(payload.inviterEmail);
  const quizTitle = normalizeText(payload.quizTitle);
  const responseDeadline = normalizeText(payload.responseDeadline);
  const responseDelayDays = toPositiveInteger(payload.responseDelayDays, 14);
  const quizLink = normalizeText(payload.quizLink);
  const invitationId = normalizeText(payload.invitationId);
  const quizId = normalizeText(payload.quizId);
  const sendInviterConfirmation = toBoolean(payload.sendInviterConfirmation);
  const invitedCount = toPositiveInteger(payload.invitedCount, 0);

  if (!inviteeEmail) return {error: "missing_invitee_email"};
  if (!quizTitle) return {error: "missing_quiz_title"};
  if (!responseDeadline) return {error: "missing_response_deadline"};
  if (!quizLink) return {error: "missing_quiz_link"};

  const deadlineDate = new Date(responseDeadline);
  if (Number.isNaN(deadlineDate.getTime())) {
    return {error: "invalid_response_deadline"};
  }

  return {
    value: {
      inviteeEmail,
      inviteeName,
      inviterFirstName,
      inviterLastName,
      inviterEmail,
      quizTitle,
      responseDeadline,
      responseDelayDays,
      quizLink,
      invitationId,
      quizId,
      sendInviterConfirmation,
      invitedCount,
    },
  };
}

module.exports = {
  normalizeText,
  toPositiveInteger,
  validateQuizInvitePayload,
};
