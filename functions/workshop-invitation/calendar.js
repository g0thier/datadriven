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

function formatDateForGoogle(date) {
  return formatDateForIcs(date);
}

function formatDateForOutlook(date) {
  return date.toISOString();
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
  location,
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
    `LOCATION:${escapeIcsText(location)}`,
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

function buildGoogleCalendarLink({
  title,
  description,
  location,
  startDate,
  endDate,
  url,
}) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    details: `${description}\n\n${url}`,
    location,
    dates: `${formatDateForGoogle(startDate)}/${formatDateForGoogle(endDate)}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function buildOutlookCalendarLink({
  title,
  description,
  location,
  startDate,
  endDate,
  url,
}) {
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: title,
    body: `${description}\n\n${url}`,
    location,
    startdt: formatDateForOutlook(startDate),
    enddt: formatDateForOutlook(endDate),
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

module.exports = {
  buildWorkshopIcs,
  buildGoogleCalendarLink,
  buildOutlookCalendarLink,
};