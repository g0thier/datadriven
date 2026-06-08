const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const nodemailer = require("nodemailer");

const { buildInviteEmail } = require("./mailTemplate");
const { buildQuizReminderIcs } = require("./calendar");
const { validateQuizInvitePayload } = require("./sendQuizInvite.shared");

function mergeName(firstName, lastName) {
  const merged = [String(firstName || "").trim(), String(lastName || "").trim()]
    .filter(Boolean)
    .join(" ");
  return merged;
}

function formatDeadlineLabel(deadlineIso) {
  const deadlineDate = new Date(deadlineIso);
  return deadlineDate.toLocaleString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

exports.sendQuizInvite = onRequest(async (req, res) => {
  try {
    const smtpUser = process.env.SMTP_USER?.trim();
    const smtpPass = process.env.SMTP_PASS?.trim();
    const mailFromName = process.env.MAIL_FROM_NAME?.trim();
    const mailFromAddress = process.env.MAIL_FROM_ADDRESS?.trim();

    if (!smtpUser) {
      throw new Error("missing_smtp_user");
    }

    if (!smtpPass) {
      throw new Error("missing_smtp_pass");
    }

    if (!mailFromName) {
      throw new Error("missing_mail_from_name");
    }

    if (!mailFromAddress) {
      throw new Error("missing_mail_from_address");
    }

    const mailSenderAddress = smtpUser;
    const mailReplyTo = mailFromAddress;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.verify();

    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      return res.status(204).send("");
    }

    if (req.method !== "POST") {
      return res.status(405).json({error: "Méthode non autorisée"});
    }

    const validation = validateQuizInvitePayload(req.body || {});
    if (validation.error) {
      return res.status(400).json({error: validation.error});
    }

    const {
      inviteeEmail,
      inviteeName,
      inviterFirstName,
      inviterLastName,
      inviterEmail,
      quizTitle,
      responseDeadline: normalizedResponseDeadline,
      responseDelayDays: resolvedDelayDays,
      quizLink: normalizedQuizLink,
      invitationId,
      quizId,
      sendInviterConfirmation,
      invitedCount,
    } = validation.value;

    const deadlineDate = new Date(normalizedResponseDeadline);
    if (Number.isNaN(deadlineDate.getTime())) {
      return res.status(400).json({error: "invalid_response_deadline"});
    }

    const reminderStartDate = new Date(deadlineDate.getTime() - 60 * 60 * 1000);
    const resolvedInviterName =
      mergeName(inviterFirstName, inviterLastName) || "Organisateur";
    const responseDeadlineLabel = formatDeadlineLabel(normalizedResponseDeadline);

    const eventTitle = `Rappel quiz : ${quizTitle}`;
    const eventDescription =
      `Invitation de ${resolvedInviterName} pour répondre au quiz ${quizTitle} avant la date limite.`;
    const quizOrganizerName = resolvedInviterName || mailFromName;
    const quizOrganizerEmail = inviterEmail || mailFromAddress;

    const icsContent = buildQuizReminderIcs({
      uid: `${Date.now()}-${inviteeEmail}@zzzbre.com`,
      title: eventTitle,
      description: eventDescription,
      startDate: reminderStartDate,
      endDate: deadlineDate,
      url: normalizedQuizLink,
      organizerName: quizOrganizerName,
      organizerEmail: quizOrganizerEmail,
    });

    const html = buildInviteEmail({
      inviteeName,
      inviterFirstName,
      inviterLastName,
      quizTitle,
      responseDeadlineLabel,
      responseDelayDays: resolvedDelayDays,
      quizLink: normalizedQuizLink,
    });

    const info = await transporter.sendMail({
      from: `${mailFromName} <${mailFromAddress}>`,
      sender: mailSenderAddress,
      replyTo: mailReplyTo,
      to: inviteeEmail,
      subject: `Invitation au quiz ${quizTitle}`,
      html,
      text: [
        `Bonjour ${inviteeName},`,
        ``,
        `Vous avez reçu une invitation de ${resolvedInviterName}.`,
        `Quiz : ${quizTitle}`,
        `Date limite : ${responseDeadlineLabel}`,
        `Délai : ${resolvedDelayDays} jour(s)`,
        `Lien quiz : ${normalizedQuizLink}`,
      ].join("\n"),
      alternatives: [
        {
          contentType: "text/calendar; method=REQUEST; charset=UTF-8",
          content: icsContent,
          headers: {
            "Content-Class": "urn:content-classes:calendarmessage",
          },
        },
      ],
    });

    logger.info("mail quiz envoyé", {
      messageId: info.messageId,
      inviteeEmail,
      invitationId,
      quizId,
    });

    let inviterConfirmationMessageId = null;
    if (sendInviterConfirmation) {
      if (!inviterEmail) {
        logger.warn("mail quiz expéditeur non envoyé: inviterEmail manquant", {
          inviteeEmail,
          invitationId,
          quizId,
        });
      } else {
        const inviterHtml = buildInviteEmail({
          inviteeName,
          inviterFirstName,
          inviterLastName,
          quizTitle,
          responseDeadlineLabel,
          responseDelayDays: resolvedDelayDays,
          quizLink: normalizedQuizLink,
          emailVariant: "inviterConfirmation",
          invitedCount,
        });

        const inviterInfo = await transporter.sendMail({
          from: `${mailFromName} <${mailFromAddress}>`,
          sender: mailSenderAddress,
          replyTo: mailReplyTo,
          to: inviterEmail,
          subject: `Invitation créée : quiz ${quizTitle}`,
          html: inviterHtml,
          text: [
            `Bonjour ${inviterFirstName || resolvedInviterName},`,
            ``,
            `Vous avez créé une invitation pour ${invitedCount} personne(s).`,
            `Quiz : ${quizTitle}`,
            `Date limite : ${responseDeadlineLabel}`,
            `Délai : ${resolvedDelayDays} jour(s)`,
            `Lien quiz : ${normalizedQuizLink}`,
          ].join("\n"),
          alternatives: [
            {
              contentType: "text/calendar; method=REQUEST; charset=UTF-8",
              content: icsContent,
              headers: {
                "Content-Class": "urn:content-classes:calendarmessage",
              },
            },
          ],
        });

        inviterConfirmationMessageId = inviterInfo.messageId;
        logger.info("mail quiz expéditeur envoyé", {
          messageId: inviterInfo.messageId,
          inviterEmail,
          invitationId,
          quizId,
        });
      }
    }

    return res.json({
      success: true,
      messageId: info.messageId,
      inviterConfirmationMessageId,
    });
  } catch (error) {
    logger.error("erreur envoi mail quiz", error);
    return res.status(500).json({
      error: "erreur envoi mail quiz",
      details: error.message,
    });
  }
});
