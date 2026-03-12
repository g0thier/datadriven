function pad(num) {
  return String(num).padStart(2, "0");
}

function formatDateForIcs(date) {
  const yyyy = date.getUTCFullYear();
  const mm = pad(date.getUTCMonth() + 1);
  const dd = pad(date.getUTCDate());
  const hh = pad(date.getUTCHours());
  const mi = pad(date.getUTCMinutes());
  const ss = pad(date.getUTCSeconds());
  return `${yyyy}${mm}${dd}T${hh}${mi}${ss}Z`;
}

function escapeIcsText(value = "") {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

// Pour les propriétés URI comme URL
function sanitizeIcsUri(value = "") {
  return String(value).replace(/\r?\n/g, "");
}

// Recommandé par la spec iCalendar : lignes <= 75 octets
function foldIcsLine(line) {
  const limit = 75;
  if (line.length <= limit) return line;

  let out = "";
  let current = line;
  while (current.length > limit) {
    out += current.slice(0, limit) + "\r\n ";
    current = current.slice(limit);
  }
  out += current;
  return out;
}

function buildWorkshopIcs({
  uid,
  title,
  description,
  startDate,
  endDate,
  url,
  organizerName = "zzzbre",
  organizerEmail = "noreply@zzzbre.com",
}) {
  const dtStamp = formatDateForIcs(new Date());
  const dtStart = formatDateForIcs(startDate);
  const dtEnd = formatDateForIcs(endDate);

  const safeUrl = sanitizeIcsUri(url);
  const fullDescription = [
    description || "",
    "",
    "Lien de participation :",
    safeUrl,
  ].join("\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//zzzbre//Workshop Invitation//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${escapeIcsText(uid)}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcsText(title)}`,
    `DESCRIPTION:${escapeIcsText(fullDescription)}`,
    `LOCATION:${safeUrl}`,
    `URL:${safeUrl}`,
    `ORGANIZER;CN=${escapeIcsText(organizerName)}:MAILTO:${sanitizeIcsUri(organizerEmail)}`,
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "TRANSP:OPAQUE",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ];

  return lines.map(foldIcsLine).join("\r\n");
}

module.exports = { buildWorkshopIcs };