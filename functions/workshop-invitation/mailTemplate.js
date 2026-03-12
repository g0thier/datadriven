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

function getZebraSvgMarkup() {
  return `
  <svg
    width="251"
    height="190"
    viewBox="0 0 251 190"
    xmlns="http://www.w3.org/2000/svg"
    style="display:block;width:100%;max-width:251px;height:auto;"
    aria-hidden="true"
  >
    <path d="M-3,195L-3.109,80.513C12.32,74.307 29.674,69.76 44,70C81.382,70.627 140.235,120.426 167.7,163.069C178.156,179.303 189,191 189,191L-3,195Z" fill="white"/>
    <clipPath id="zebraClip">
      <path d="M-3,195L-3.109,80.513C12.32,74.307 29.674,69.76 44,70C81.382,70.627 140.235,120.426 167.7,163.069C178.156,179.303 189,191 189,191L-3,195Z"/>
    </clipPath>
    <g clip-path="url(#zebraClip)">
      <path d="M152.549,138.18L123.259,170.869L104.393,196.931L149.268,193.477L168.205,159.843L152.549,138.18Z"/>
      <path d="M-12,146L-3,133C-3,133 18.816,155.102 30,192L20,194C20,194 8.197,167.333 -12,146"/>
      <g transform="matrix(1,0,0,1,0,-1)">
        <path d="M86.673,81.483L44.968,212.137L61.144,204.945L151.411,89.011L86.673,81.483Z"/>
      </g>
      <path d="M101,201L122,173C122,173 139.352,193.294 141,205L101,201Z"/>
      <path d="M18.128,66.37L27.683,118.017L32.514,197.32L41.468,197.178L47.428,115.207L54.676,63.017L18.128,66.37Z"/>
    </g>
    <path d="M144.785,192.586C118.496,151.296 83.732,111.467 39.191,111.467C10.782,111.467 -4.865,123.518 -4.865,123.518L-5.379,132.671C-5.379,132.671 11.334,116.29 43.044,116.29C74.755,116.29 115.982,161.4 138.209,192.865C138.209,192.865 145.963,194.437 144.785,192.586Z"/>
    <path d="M-3.061,130.958C-3.061,130.958 5.9,115.314 44.075,115.314C84.337,115.314 124.364,172.935 139.511,191.074L134.822,191.095C119.805,171.65 79.169,119.292 43.888,119.292C12.023,119.292 -3.138,136.989 -3.138,136.989L-3.061,130.958Z" fill="white"/>
    <g>
      <path d="M76,124C76.031,116.304 99.632,99.205 145,97C145,97 112.268,154 94,154C75.732,154 75.958,134.563 76,124Z" fill="white"/>
      <path d="M108,140C108,140 104.426,110.554 136,97L160,99L162,117C162,117 147.974,142.39 127,154C127,154 111.957,156.926 103,152C94.043,147.074 108,140 108,140Z" fill="rgb(131,130,130)"/>
      <path d="M122,152C122,152 132.672,129.825 146,125C146,125 141.899,121.988 133,126C133,126 137.984,115.268 146,115C146,115 138.225,107.663 126,116C113.775,124.337 98,149 98,149C98,149 98.675,154 110,154C121.325,154 122,152 122,152Z" fill="rgb(154,154,154)"/>
      <path d="M98,127C98.031,119.304 108,120.304 108,128C108,136.5 112.268,154 94,154C75.732,154 97.958,137.563 98,127Z" fill="white"/>
      <path d="M111,121C111,121 120,93 152,93C162.009,93 165,99.991 165,106C165,133.338 127,154 127,154C127,154 159.982,129.242 160,106C160.002,102.952 157.828,98.994 153,99C120.667,99.037 111,121 111,121Z"/>
    </g>
  </svg>
  `;
}

function buildInviteEmail({
  inviteeName,
  inviterName,
  workshopTitle,
  workshopDate,
  workshopDuration,
  workshopLink,
  appleCalendarLink,
  microsoftCalendarLink,
  googleCalendarLink,
}) {
  return `
  <!DOCTYPE html>
  <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="x-apple-disable-message-reformatting" />
      <title>Invitation atelier</title>
    </head>
    <body style="margin:0;padding:0;background-color:#fcd34d;font-family:Arial,Helvetica,sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background-color:#fcd34d;">
        <tr>
          <td align="center" style="padding:32px 16px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:720px;">
              <tr>
                <td style="background:#ffffff;border-radius:28px;overflow:hidden;position:relative;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td style="padding:40px 32px 20px 32px;">
                        <h1 style="margin:0 0 24px 0;font-size:40px;line-height:1.1;color:#111827;font-weight:800;">
                          Bonjour ${escapeHtml(inviteeName)},
                        </h1>

                        <p style="margin:0 0 14px 0;font-size:20px;line-height:1.6;color:#1f2937;">
                          Vous avez reçu une invitation de ${escapeHtml(inviterName)},
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

                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                          <tr>
                            <td style="padding-bottom:12px;">
                              <span style="display:block;text-align:center;background:#111827;color:#ffffff;font-weight:700;padding:16px 20px;border-radius:16px;font-size:16px;">
                                Calendrier Apple / iCloud : pièce jointe .ics
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding-bottom:12px;">
                              <a href="${escapeAttr(microsoftCalendarLink)}" style="display:block;text-align:center;background:#1d4ed8;color:#ffffff;text-decoration:none;font-weight:700;padding:16px 20px;border-radius:16px;font-size:16px;">
                                Calendrier Microsoft / Hotmail
                              </a>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <a href="${escapeAttr(googleCalendarLink)}" style="display:block;text-align:center;background:#ffffff;color:#111827;text-decoration:none;font-weight:700;padding:16px 20px;border-radius:16px;font-size:16px;border:1px solid #e5e7eb;">
                                Calendrier Google
                              </a>
                            </td>
                          </tr>
                        </table>

                        <p style="margin:28px 0 0 0;font-size:13px;line-height:1.5;color:#6b7280;">
                          Cet email a été envoyé automatiquement par zzzbre.
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td align="left" style="padding:0 0 0 0;line-height:0;font-size:0;">
                        ${getZebraSvgMarkup()}
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