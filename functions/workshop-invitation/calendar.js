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
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
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

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//zzzbre//Workshop Invitation//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${escapeIcsText(uid)}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcsText(title)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `LOCATION:${escapeIcsText(url)}`,
    `URL:${escapeIcsText(url)}`,
    `ORGANIZER;CN=${escapeIcsText(organizerName)}:MAILTO:${organizerEmail}`,
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "TRANSP:OPAQUE",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

module.exports = { buildWorkshopIcs };
