/**
 * @module utils/workshopDateTime
 * @description Date/time utilities for workshop scheduling with UTC offset handling.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

const WORKSHOP_TIMEZONE_FALLBACK = "UTC+01:00";
const MIN_UTC_OFFSET_MINUTES = -12 * 60;
const MAX_UTC_OFFSET_MINUTES = 14 * 60;
const UTC_OFFSET_STEP_MINUTES = 15;

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
  if (![0, 15, 30, 45].includes(minutes)) return null;

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
 * Returns the default workshop timezone used by the app.
 * @returns {string} Default timezone string.
 */
export function resolveDefaultWorkshopTimeZone() {
  return WORKSHOP_TIMEZONE_FALLBACK;
}

/**
 * Returns all valid UTC offset options, ensuring selected offset is included.
 * @param {string} selectedTimeZone - Currently selected timezone.
 * @returns {string[]} Ordered unique timezone options.
 */
export function getWorkshopTimeZoneOptions(selectedTimeZone) {
  const allOffsets = [];
  for (
    let minutes = MIN_UTC_OFFSET_MINUTES;
    minutes <= MAX_UTC_OFFSET_MINUTES;
    minutes += UTC_OFFSET_STEP_MINUTES
  ) {
    allOffsets.push(formatUtcOffset(minutes));
  }

  const selectedOffsetMinutes = parseUtcOffsetToMinutes(selectedTimeZone);
  const selectedOffset =
    selectedOffsetMinutes === null
      ? WORKSHOP_TIMEZONE_FALLBACK
      : formatUtcOffset(selectedOffsetMinutes);

  const zones = [selectedOffset, ...allOffsets];
  return Array.from(new Set(zones));
}

/**
 * Converts workshop local date/time and UTC offset into an ISO UTC instant.
 * @param {string} date - Date in `YYYY-MM-DD` format.
 * @param {string} time - Time in `HH:mm` or `HH:mm:ss` format.
 * @param {string} timeZone - Time zone as `UTC±HH:MM`.
 * @returns {string} ISO datetime string, or empty string when input is invalid.
 */
export function toWorkshopStartIso(date, time, timeZone) {
  const parsed = parseDateAndTime(date, time);
  if (!parsed) return "";

  const parsedOffset = parseUtcOffsetToMinutes(timeZone);
  const fallbackOffset = parseUtcOffsetToMinutes(WORKSHOP_TIMEZONE_FALLBACK);
  const offsetMinutes = parsedOffset ?? fallbackOffset;
  if (offsetMinutes === null) return "";

  const localAsUtcTimestamp = Date.UTC(
    parsed.year,
    parsed.month - 1,
    parsed.day,
    parsed.hour,
    parsed.minute,
    parsed.second,
    0
  );

  const utcTimestamp = localAsUtcTimestamp - offsetMinutes * 60 * 1000;

  const instant = new Date(utcTimestamp);
  if (Number.isNaN(instant.getTime())) return "";

  return instant.toISOString();
}
