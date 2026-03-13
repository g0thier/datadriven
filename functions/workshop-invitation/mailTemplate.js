function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(str = "") {
  return escapeHtml(str);
}

function formatPeopleCount(count) {
  const parsed = Number.parseInt(String(count), 10);
  const safeCount = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  return `${safeCount} personne${safeCount > 1 ? "s" : ""}`;
}

function mergeName(firstName = "", lastName = "") {
  const merged = [String(firstName || "").trim(), String(lastName || "").trim()]
    .filter(Boolean)
    .join(" ");
  return merged;
}

function buildInviteEmail({
  inviteeName,
  inviterFirstName = "",
  inviterLastName = "",
  workshopTitle,
  workshopDate,
  workshopDuration,
  workshopLink,
  emailVariant = "invitee",
  invitedCount = 0,
}) {
  const isInviterConfirmation = emailVariant === "inviterConfirmation";
  const backgroundColor = isInviterConfirmation ? "#f9a8d4" : "#fcd34d";
  const mergedInviterName = mergeName(inviterFirstName, inviterLastName) || "votre organisateur";
  const displayedRecipientName = isInviterConfirmation
    ? (String(inviterFirstName || "").trim() || mergedInviterName)
    : inviteeName;
  const introLine = isInviterConfirmation
    ? `Vous avez créé une invitation pour ${escapeHtml(formatPeopleCount(invitedCount))}.`
    : `Vous avez reçu une invitation de ${escapeHtml(mergedInviterName)},`;

  return `
  <!DOCTYPE html>
  <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="x-apple-disable-message-reformatting" />
      <title>Invitation atelier</title>
    </head>
    <body style="margin:0;padding:0;background-color:${backgroundColor};font-family:Arial,Helvetica,sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background-color:${backgroundColor};">
        <tr>
          <td align="center" style="padding:32px 16px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:720px;">
              <tr>
                <td style="background:#ffffff;border-radius:28px;overflow:hidden;position:relative;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td style="padding:40px 32px 20px 32px;">
                        <h1 style="margin:0 0 24px 0;font-size:40px;line-height:1.1;color:#111827;font-weight:800;">
                          Bonjour ${escapeHtml(displayedRecipientName)},
                        </h1>

                        <p style="margin:0 0 14px 0;font-size:20px;line-height:1.6;color:#1f2937;">
                          ${introLine}
                        </p>

                        <p style="margin:0 0 14px 0;font-size:20px;line-height:1.6;color:#1f2937;">
                          pour participer à un atelier de :
                          <span style="font-weight:700;">${escapeHtml(workshopTitle)}</span>
                        </p>

                        <p style="margin:0 0 28px 0;font-size:20px;line-height:1.6;color:#1f2937;">
                          Le <span style="font-weight:700;">${escapeHtml(workshopDate)}</span>,
                          pour une durée de <span style="font-weight:700;">${escapeHtml(workshopDuration)}</span>
                        </p>

                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 32px 0;">
                          <tr>
                            <td style="border:1px solid #e5e7eb;border-radius:18px;padding:18px;text-align:center;">
                              <a href="${escapeAttr(workshopLink)}" style="color:#4338ca;font-size:16px;font-weight:700;text-decoration:underline;word-break:break-all;">
                                ${escapeHtml(workshopLink)}
                              </a>
                            </td>
                          </tr>
                        </table>

                        <p style="margin:28px 0 0 0;font-size:13px;line-height:1.5;color:#6b7280;">
                          Cet email a été envoyé automatiquement par zzzbre.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
}

module.exports = {
  buildInviteEmail,
};
