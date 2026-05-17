const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

const {verifyRequestIdentity, buildHttpError} = require("../common/auth");
const {getAdminDatabase, getAdminMessaging} = require("../common/firebaseAdmin");
const {
  validateQuizInvitePayload,
  normalizeRecipients,
  extractTokensFromUserData,
  aggregateMulticastResults,
  normalizeText,
} = require("./sendQuizInviteFcm.shared");

function setCorsHeaders(res) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function normalizeRole(value) {
  return normalizeText(value).toLowerCase();
}

function isManagerRole(role) {
  return role === "owner" || role === "leader";
}

exports.sendQuizInviteFcm = onRequest(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  if (req.method !== "POST") {
    return res.status(405).json({error: "method_not_allowed"});
  }

  try {
    const identity = await verifyRequestIdentity(req);
    const requesterRole = normalizeRole(identity?.userData?.role);

    if (!isManagerRole(requesterRole)) {
      throw buildHttpError(403, "insufficient_role");
    }

    const validation = validateQuizInvitePayload(req.body || {});
    if (validation.error) {
      throw buildHttpError(400, validation.error);
    }

    const payload = validation.value;

    if (payload.companyId !== identity.companyId) {
      throw buildHttpError(403, "company_mismatch");
    }

    const recipients = normalizeRecipients(payload.recipients);
    if (recipients.length === 0) {
      return res.status(200).json({
        success: true,
        sentCount: 0,
        failedCount: 0,
        skippedCount: 0,
        tokensCount: 0,
      });
    }

    const database = getAdminDatabase();

    const userSnapshots = await Promise.all(
      recipients.map((recipient) => database.ref(`users/${recipient.uid}`).get())
    );

    const tokens = new Set();
    let skippedCount = 0;

    userSnapshots.forEach((snapshot) => {
      if (!snapshot.exists()) {
        skippedCount += 1;
        return;
      }

      const userData = snapshot.val() || {};
      if (normalizeText(userData?.companyId) !== identity.companyId) {
        skippedCount += 1;
        return;
      }

      const userTokens = extractTokensFromUserData(userData);
      if (userTokens.length === 0) {
        skippedCount += 1;
        return;
      }

      userTokens.forEach((token) => tokens.add(token));
    });

    const tokenList = Array.from(tokens);
    if (tokenList.length === 0) {
      return res.status(200).json({
        success: true,
        sentCount: 0,
        failedCount: 0,
        skippedCount,
        tokensCount: 0,
      });
    }

    const notification = {
      title: `Invitation: ${payload.quizTitle}`,
      body: `Vous avez ${payload.responseDelayDays} jour(s) pour répondre à ce quiz.`,
    };

    const data = {
      type: "quiz_invitation",
      invitationId: payload.invitationId,
      companyId: payload.companyId,
      quizId: payload.quizId,
      quizTitle: payload.quizTitle,
      responseDeadline: payload.responseDeadline,
      responseDelayDays: String(payload.responseDelayDays),
    };

    const batchResponse = await getAdminMessaging().sendEachForMulticast({
      tokens: tokenList,
      notification,
      data,
      android: {
        priority: "high",
      },
      apns: {
        headers: {
          "apns-priority": "10",
        },
      },
    });

    const aggregated = aggregateMulticastResults(batchResponse, skippedCount);

    logger.info("sendQuizInviteFcm completed", {
      invitationId: payload.invitationId,
      companyId: payload.companyId,
      recipientsCount: recipients.length,
      tokensCount: tokenList.length,
      sentCount: aggregated.sentCount,
      failedCount: aggregated.failedCount,
      skippedCount: aggregated.skippedCount,
    });

    return res.status(200).json({
      success: true,
      ...aggregated,
      recipientsCount: recipients.length,
      tokensCount: tokenList.length,
    });
  } catch (error) {
    logger.error("sendQuizInviteFcm failed", {
      code: error?.code || "",
      message: error?.message || String(error),
    });

    if (error?.status && error?.code) {
      return res.status(error.status).json({error: error.code});
    }

    return res.status(500).json({error: "send_quiz_invite_fcm_failed"});
  }
});
