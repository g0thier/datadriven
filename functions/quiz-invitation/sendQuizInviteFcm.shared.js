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

function validateQuizInvitePayload(payload = {}) {
  const invitationId = normalizeText(payload.invitationId);
  const companyId = normalizeText(payload.companyId);
  const quizId = normalizeText(payload.quizId);
  const quizTitle = normalizeText(payload.quizTitle);
  const responseDeadline = normalizeText(payload.responseDeadline);
  const responseDelayDays = toPositiveInteger(payload.responseDelayDays, 14);
  const recipients = Array.isArray(payload.recipients) ? payload.recipients : [];

  if (!invitationId) return { error: "missing_invitation_id" };
  if (!companyId) return { error: "missing_company_id" };
  if (!quizId) return { error: "missing_quiz_id" };
  if (!quizTitle) return { error: "missing_quiz_title" };
  if (!responseDeadline) return { error: "missing_response_deadline" };

  const deadlineDate = new Date(responseDeadline);
  if (Number.isNaN(deadlineDate.getTime())) {
    return { error: "invalid_response_deadline" };
  }

  return {
    value: {
      invitationId,
      companyId,
      quizId,
      quizTitle,
      responseDeadline,
      responseDelayDays,
      recipients,
    },
  };
}

function normalizeRecipients(recipients = []) {
  const source = Array.isArray(recipients) ? recipients : [];
  const recipientsByUid = new Map();

  source.forEach((recipient) => {
    const uid = normalizeText(recipient?.uid || recipient?.id);
    if (!uid) return;

    if (!recipientsByUid.has(uid)) {
      recipientsByUid.set(uid, {
        uid,
        label: normalizeText(recipient?.label),
        email: normalizeText(recipient?.email).toLowerCase(),
        firstName: normalizeText(recipient?.firstName),
        lastName: normalizeText(recipient?.lastName),
        name: normalizeText(recipient?.name),
      });
    }
  });

  return Array.from(recipientsByUid.values());
}

function extractTokensFromUserData(userData = {}) {
  const tokenSet = new Set();

  const addToken = (candidate) => {
    const token = normalizeText(candidate);
    if (token) tokenSet.add(token);
  };

  addToken(userData?.fcmToken);

  if (Array.isArray(userData?.fcmTokens)) {
    userData.fcmTokens.forEach(addToken);
  }

  if (Array.isArray(userData?.pushTokens)) {
    userData.pushTokens.forEach(addToken);
  }

  if (userData?.fcmTokens && typeof userData.fcmTokens === "object" && !Array.isArray(userData.fcmTokens)) {
    Object.values(userData.fcmTokens).forEach((value) => {
      if (typeof value === "string") {
        addToken(value);
        return;
      }

      if (value && typeof value === "object") {
        addToken(value.token);
        addToken(value.fcmToken);
      }
    });
  }

  if (userData?.devices && typeof userData.devices === "object") {
    Object.values(userData.devices).forEach((deviceData) => {
      if (!deviceData || typeof deviceData !== "object") return;
      addToken(deviceData.token);
      addToken(deviceData.fcmToken);
    });
  }

  return Array.from(tokenSet);
}

function aggregateMulticastResults(batchResponse = null, skippedCount = 0) {
  const successCount = Number(batchResponse?.successCount || 0);
  const failureCount = Number(batchResponse?.failureCount || 0);

  return {
    sentCount: successCount,
    failedCount: failureCount,
    skippedCount: Number(skippedCount || 0),
  };
}

module.exports = {
  normalizeText,
  validateQuizInvitePayload,
  normalizeRecipients,
  extractTokensFromUserData,
  aggregateMulticastResults,
};
