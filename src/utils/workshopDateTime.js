/**
 * @module utils/workshopDateTime
 * @description Date/time utilities for workshop scheduling with timezone handling.
 * @author Gauthier Rammault
 * @version 2.0.0
 * @license proprietary
 */

import { getTimeZones } from "@vvo/tzdb";
import { DateTime, FixedOffsetZone, Info } from "luxon";

const WORKSHOP_TIMEZONE_FALLBACK = "UTC";
const MIN_UTC_OFFSET_MINUTES = -12 * 60;
const MAX_UTC_OFFSET_MINUTES = 14 * 60;

/**
 * Left-pads a numeric value to two digits.
 * @param {number|string} value - Value to pad.
 * @returns {string} Two-digit string.
 */
function pad2(value) {
  return String(value).padStart(2, "0");
}

/**
 * Formats a UTC offset in minutes as `UTC±HH:MM`.
 * @param {number} offsetMinutes - Offset value in minutes.
 * @returns {string} Formatted UTC offset.
 */
function formatUtcOffset(offsetMinutes) {
  if (offsetMinutes === 0) return "UTC+00:00";

  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absolute = Math.abs(offsetMinutes);
  const hours = Math.floor(absolute / 60);
  const minutes = absolute % 60;

  return `UTC${sign}${pad2(hours)}:${pad2(minutes)}`;
}

/**
 * Parses a `UTC±HH:MM` offset string into minutes.
 * @param {string} timeZone - Time zone string.
 * @returns {number|null} Offset in minutes, or `null` when invalid.
 */
function parseUtcOffsetToMinutes(timeZone) {
  const normalized = String(timeZone || "").trim().toUpperCase();
  const match = /^UTC([+-])(\d{2}):(\d{2})$/.exec(normalized);
  if (!match) return null;

  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number(match[2]);
  const minutes = Number(match[3]);
  if (hours > 14) return null;
  if (minutes < 0 || minutes > 59) return null;

  const totalMinutes = sign * (hours * 60 + minutes);
  if (totalMinutes < MIN_UTC_OFFSET_MINUTES) return null;
  if (totalMinutes > MAX_UTC_OFFSET_MINUTES) return null;

  return totalMinutes;
}

/**
 * Parses and validates workshop date/time fields.
 * @param {string} date - Date in `YYYY-MM-DD` format.
 * @param {string} time - Time in `HH:mm` or `HH:mm:ss` format.
 * @returns {{year:number, month:number, day:number, hour:number, minute:number, second:number}|null} Parsed parts or `null`.
 */
function parseDateAndTime(date, time) {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(date || "").trim());
  const timeMatch = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(
    String(time || "").trim()
  );

  if (!dateMatch || !timeMatch) return null;

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  const second = Number(timeMatch[3] || 0);

  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  if (hour < 0 || hour > 23) return null;
  if (minute < 0 || minute > 59) return null;
  if (second < 0 || second > 59) return null;

  const checkDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  if (Number.isNaN(checkDate.getTime())) return null;
  if (checkDate.getUTCFullYear() !== year) return null;
  if (checkDate.getUTCMonth() + 1 !== month) return null;
  if (checkDate.getUTCDate() !== day) return null;

  return { year, month, day, hour, minute, second };
}

/**
 * Validates an IANA time zone string.
 * @param {string} value - Candidate time zone.
 * @returns {boolean} `true` when valid.
 */
function isValidIanaTimeZone(value) {
  const candidate = String(value || "").trim();
  if (!candidate) return false;
  return Info.isValidIANAZone(candidate);
}

/**
 * Resolves browser timezone if available and valid.
 * @returns {string|null} Browser timezone or `null`.
 */
function resolveBrowserTimeZone() {
  try {
    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return isValidIanaTimeZone(browserTz) ? browserTz : null;
  } catch {
    return null;
  }
}

/**
 * Builds a stable reference datetime to compute dynamic offsets.
 * @param {string} date - Date in `YYYY-MM-DD` format.
 * @param {string} time - Time in `HH:mm` or `HH:mm:ss` format.
 * @returns {DateTime} Reference datetime in UTC.
 */
function buildReferenceDateTime(date, time) {
  const parsed = parseDateAndTime(date, time);
  if (parsed) {
    return DateTime.utc(
      parsed.year,
      parsed.month,
      parsed.day,
      parsed.hour,
      parsed.minute,
      parsed.second,
      0
    );
  }

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(date || "").trim());
  if (dateOnlyMatch) {
    return DateTime.utc(
      Number(dateOnlyMatch[1]),
      Number(dateOnlyMatch[2]),
      Number(dateOnlyMatch[3]),
      12,
      0,
      0,
      0
    );
  }

  return DateTime.utc();
}

/**
 * Resolves a conversion zone from IANA or legacy UTC offsets.
 * @param {string} timeZone - Candidate timezone.
 * @returns {{zone:string|Object, timezone:string}} Normalized conversion metadata.
 */
function resolveConversionZone(timeZone) {
  const normalized = String(timeZone || "").trim();

  const legacyOffset = parseUtcOffsetToMinutes(normalized);
  if (legacyOffset !== null) {
    return {
      zone: FixedOffsetZone.instance(legacyOffset),
      timezone: formatUtcOffset(legacyOffset),
    };
  }

  if (isValidIanaTimeZone(normalized)) {
    return {
      zone: normalized,
      timezone: normalized,
    };
  }

  return {
    zone: WORKSHOP_TIMEZONE_FALLBACK,
    timezone: WORKSHOP_TIMEZONE_FALLBACK,
  };
}

/**
 * Returns the default workshop timezone used by the app.
 * @returns {string} Default timezone string.
 */
export function resolveDefaultWorkshopTimeZone() {
  return resolveBrowserTimeZone() || WORKSHOP_TIMEZONE_FALLBACK;
}

/**
 * Returns all valid timezone options, ensuring selected timezone is included.
 * @param {string} selectedTimeZone - Currently selected timezone.
 * @param {{date?:string,time?:string}} [reference={}] - Optional workshop date/time context.
 * @returns {{value:string,label:string}[]} Ordered unique timezone options.
 */
export function getWorkshopTimeZoneOptions(selectedTimeZone, reference = {}) {
  const referenceDateTime = buildReferenceDateTime(reference.date, reference.time);

  const allNames = getTimeZones({ includeUtc: true }).flatMap((zone) => {
    if (Array.isArray(zone.group) && zone.group.length > 0) {
      return zone.group;
    }
    return [zone.name];
  });

  const uniqueIanaNames = Array.from(new Set(allNames.filter(isValidIanaTimeZone))).sort(
    (a, b) => a.localeCompare(b)
  );

  const selectedZone = resolveConversionZone(selectedTimeZone).timezone;
  const selectedIsIana = isValidIanaTimeZone(selectedZone);
  const allZoneNames = selectedIsIana
    ? [selectedZone, ...uniqueIanaNames]
    : uniqueIanaNames;

  const uniqueNames = Array.from(new Set(allZoneNames));

  const options = uniqueNames.map((zoneName) => {
    const zoneAtReference = referenceDateTime.setZone(zoneName);
    const offsetLabel = zoneAtReference.isValid
      ? formatUtcOffset(zoneAtReference.offset)
      : "UTC+00:00";

    return {
      value: zoneName,
      label: `${zoneName} (${offsetLabel})`,
    };
  });

  if (!selectedIsIana) {
    options.unshift({
      value: selectedZone,
      label: `${selectedZone} (legacy)`,
    });
  }

  return options;
}

/**
 * Converts workshop local date/time and timezone into an ISO UTC instant.
 * @param {string} date - Date in `YYYY-MM-DD` format.
 * @param {string} time - Time in `HH:mm` or `HH:mm:ss` format.
 * @param {string} timeZone - Time zone as IANA (`Europe/Zurich`) or legacy `UTC±HH:MM`.
 * @returns {string} ISO datetime string, or empty string when input is invalid.
 */
export function toWorkshopStartIso(date, time, timeZone) {
  const parsed = parseDateAndTime(date, time);
  if (!parsed) return "";

  const resolved = resolveConversionZone(timeZone);
  const zonedDateTime = DateTime.fromObject(
    {
      year: parsed.year,
      month: parsed.month,
      day: parsed.day,
      hour: parsed.hour,
      minute: parsed.minute,
      second: parsed.second,
      millisecond: 0,
    },
    { zone: resolved.zone }
  );

  if (!zonedDateTime.isValid) return "";

  return zonedDateTime.toUTC().toJSDate().toISOString();
}
