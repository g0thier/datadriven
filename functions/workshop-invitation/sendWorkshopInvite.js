const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const nodemailer = require("nodemailer");

const { buildInviteEmail } = require("./mailTemplate");
const { buildWorkshopIcs } = require("./calendar");
const { toWorkshopStartIso } = require("./dateTime");

function parseDurationToMinutes(duration) {
  if (typeof duration === "number") return duration;

  const text = String(duration || "").toLowerCase().trim();
  const match = text.match(/(\d+)/);
  if (!match) return 50;

  return Number(match[1]);
}

function mergeName(firstName, lastName) {
  const merged = [String(firstName || "").trim(), String(lastName || "").trim()]
    .filter(Boolean)
    .join(" ");
  return merged;
}

exports.sendWorkshopInvite = onRequest(async (req, res) => {
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
      return res.status(405).json({ error: "Méthode non autorisée" });
    }

    const {
      inviteeEmail,
      inviteeName = "Trucmuche",
      inviterFirstName = "",
      inviterLastName = "",
      inviterEmail = "",
      workshopTitle = "Paper Brain",
      workshopDateLabel = "",
      workshopDuration = "50 minutes",
      workshopStartIso,
      workshopSchedule = {},
      workshopDate = "",
      workshopTime = "",
      workshopTimezone = "UTC",
      workshopLink = "",
      sendInviterConfirmation = false,
      invitedCount = 0,
    } = req.body || {};

    if (!inviteeEmail) {
      return res.status(400).json({ error: "inviteeEmail requis" });
    }

    let normalizedWorkshopStartIso =
      typeof workshopStartIso === "string" ? workshopStartIso.trim() : "";
    const scheduleDate = String(workshopSchedule?.date || workshopDate || "").trim();
    const scheduleTime = String(workshopSchedule?.time || workshopTime || "").trim();
    const scheduleTimezone = String(
      workshopSchedule?.timezone || workshopTimezone || "UTC"
    ).trim();
    const normalizedWorkshopLink = String(workshopLink || "").trim();

    if (!normalizedWorkshopLink) {
      return res.status(400).json({ error: "workshopLink requis" });
    }

    if (!normalizedWorkshopStartIso && scheduleDate && scheduleTime) {
      normalizedWorkshopStartIso = toWorkshopStartIso(
        scheduleDate,
        scheduleTime,
        scheduleTimezone
      );
    }

    if (!normalizedWorkshopStartIso) {
      return res.status(400).json({ error: "workshopStartIso requis" });
    }

    const startDate = new Date(normalizedWorkshopStartIso);
    if (Number.isNaN(startDate.getTime())) {
      return res.status(400).json({ error: "workshopStartIso invalide" });
    }

    const durationMinutes = parseDurationToMinutes(workshopDuration);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
    const resolvedInviterName =
      mergeName(inviterFirstName, inviterLastName) || "Organisateur";

    const title = `Atelier : ${workshopTitle}`;
    const description =
      `Invitation de ${resolvedInviterName} pour participer à l’atelier ${workshopTitle}.`;
    const workshopOrganizerName = resolvedInviterName || mailFromName;
    const workshopOrganizerEmail = inviterEmail || mailFromAddress;
    const resolvedWorkshopDateLabel =
      workshopDateLabel ||
      (scheduleDate && scheduleTime
        ? `${scheduleDate} à ${scheduleTime}`
        : normalizedWorkshopStartIso);

    const icsContent = buildWorkshopIcs({
      uid: `${Date.now()}-${inviteeEmail}@zzzbre.com`,
      title,
      description,
      startDate,
      endDate,
      url: normalizedWorkshopLink,
      organizerName: workshopOrganizerName,
      organizerEmail: workshopOrganizerEmail,
    });

    const html = buildInviteEmail({
      inviteeName,
      inviterFirstName,
      inviterLastName,
      workshopTitle,
      workshopDate: resolvedWorkshopDateLabel,
      workshopDuration: `${durationMinutes} minutes`,
      workshopLink: normalizedWorkshopLink,
    });

    const info = await transporter.sendMail({
      from: `${mailFromName} <${mailFromAddress}>`,
      sender: mailSenderAddress,
      replyTo: mailReplyTo,
      to: inviteeEmail,
      subject: `Invitation à l’atelier ${workshopTitle}`,
      html,
      text: [
        `Bonjour ${inviteeName},`,
        ``,
        `Vous avez reçu une invitation de ${resolvedInviterName}.`,
        `Atelier : ${workshopTitle}`,
        `Date : ${resolvedWorkshopDateLabel}`,
        `Durée : ${durationMinutes} minutes`,
        `Lien atelier : ${normalizedWorkshopLink}`,
      ].join("\n"),
      /*
        icalEvent: {
          filename: "workshop-invitation.ics",
          method: "REQUEST",
          content: icsContent,
        },*/
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

    logger.info("mail envoyé", {
      messageId: info.messageId,
      inviteeEmail,
    });

    let inviterConfirmationMessageId = null;
    if (sendInviterConfirmation) {
      if (!inviterEmail) {
        logger.warn("mail expéditeur non envoyé: inviterEmail manquant", {
          inviteeEmail,
        });
      } else {
        const inviterHtml = buildInviteEmail({
          inviteeName,
          inviterFirstName,
          inviterLastName,
          workshopTitle,
          workshopDate: resolvedWorkshopDateLabel,
          workshopDuration: `${durationMinutes} minutes`,
          workshopLink: normalizedWorkshopLink,
          emailVariant: "inviterConfirmation",
          invitedCount,
        });

        const inviterInfo = await transporter.sendMail({
          from: `${mailFromName} <${mailFromAddress}>`,
          sender: mailSenderAddress,
          replyTo: mailReplyTo,
          to: inviterEmail,
          subject: `Invitation créée : atelier ${workshopTitle}`,
          html: inviterHtml,
          text: [
            `Bonjour ${inviterFirstName},`,
            ``,
            `Vous avez créé une invitation pour ${invitedCount} personne(s).`,
            `Atelier : ${workshopTitle}`,
            `Date : ${resolvedWorkshopDateLabel}`,
            `Durée : ${durationMinutes} minutes`,
            `Lien atelier : ${normalizedWorkshopLink}`,
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
        logger.info("mail expéditeur envoyé", {
          messageId: inviterInfo.messageId,
          inviterEmail,
        });
      }
    }

    return res.json({
      success: true,
      messageId: info.messageId,
      inviterConfirmationMessageId,
    });
  } catch (error) {
    logger.error("erreur envoi mail", error);
    return res.status(500).json({
      error: "erreur envoi mail",
      details: error.message,
    });
  }
});
