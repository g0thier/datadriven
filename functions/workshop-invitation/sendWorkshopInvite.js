const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const nodemailer = require("nodemailer");

const SMTP_USER = defineSecret("SMTP_USER");
const SMTP_PASS = defineSecret("SMTP_PASS");
const MAIL_FROM_NAME = defineSecret("MAIL_FROM_NAME");
const MAIL_FROM_ADDRESS = defineSecret("MAIL_FROM_ADDRESS");

const { buildInviteEmail } = require("./mailTemplate");
const { buildWorkshopIcs } = require("./calendar");

function parseDurationToMinutes(duration) {
  if (typeof duration === "number") return duration;

  const text = String(duration || "").toLowerCase().trim();
  const match = text.match(/(\d+)/);
  if (!match) return 50;

  return Number(match[1]);
}

exports.sendWorkshopInvite = onRequest(
  {
    secrets: [SMTP_USER, SMTP_PASS, MAIL_FROM_NAME, MAIL_FROM_ADDRESS],
  },
  async (req, res) => {
    try {
      const smtpUser = SMTP_USER.value();
      const smtpPass = SMTP_PASS.value();
      const mailFromName = MAIL_FROM_NAME.value();
      const mailFromAddress = MAIL_FROM_ADDRESS.value();

      const mailSenderAddress = smtpUser;
      const mailReplyTo = mailFromAddress;
      const mailOrganizerName = mailFromName;
      const mailOrganizerEmail = mailFromAddress;

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
        inviterName = "Gauthier Rammault",
        workshopTitle = "Paper Brain",
        workshopDateLabel = "13 02 2026 à 14h00",
        workshopDuration = "50 minutes",
        workshopStartIso,
        workshopLink = "https://zzzbre.com/innovation/paper-brain/jyw-qfgi-cjs",
        workshopLocation = "En ligne",
      } = req.body || {};

      if (!inviteeEmail) {
        return res.status(400).json({ error: "inviteeEmail requis" });
      }

      if (!workshopStartIso) {
        return res.status(400).json({ error: "workshopStartIso requis" });
      }

      const startDate = new Date(workshopStartIso);
      if (Number.isNaN(startDate.getTime())) {
        return res.status(400).json({ error: "workshopStartIso invalide" });
      }

      const durationMinutes = parseDurationToMinutes(workshopDuration);
      const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

      const title = `Atelier : ${workshopTitle}`;
      const description =
        `Invitation de ${inviterName} pour participer à l’atelier ${workshopTitle}.`;

      const icsContent = buildWorkshopIcs({
        uid: `${Date.now()}-${inviteeEmail}@zzzbre.com`,
        title,
        description,
        location: workshopLocation,
        startDate,
        endDate,
        url: workshopLink,
        organizerName: mailOrganizerName,
        organizerEmail: mailOrganizerEmail,
      });

      const html = buildInviteEmail({
        inviteeName,
        inviterName,
        workshopTitle,
        workshopDate: workshopDateLabel,
        workshopDuration: `${durationMinutes} minutes`,
        workshopLink,
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
          `Vous avez reçu une invitation de ${inviterName}.`,
          `Atelier : ${workshopTitle}`,
          `Date : ${workshopDateLabel}`,
          `Durée : ${durationMinutes} minutes`,
          `Lien atelier : ${workshopLink}`,
        ].join("\n"),
        icalEvent: {
          filename: "workshop-invitation.ics",
          method: "REQUEST",
          content: icsContent,
        },
      });

      logger.info("mail envoyé", {
        messageId: info.messageId,
        inviteeEmail,
      });

      return res.json({
        success: true,
        messageId: info.messageId,
      });
    } catch (error) {
      logger.error("erreur envoi mail", error);
      return res.status(500).json({
        error: "erreur envoi mail",
        details: error.message,
      });
    }
});
