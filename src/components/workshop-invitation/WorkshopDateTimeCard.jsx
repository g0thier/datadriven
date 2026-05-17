/**
 * @module components/workshop-invitation/WorkshopDateTimeCard
 * @description UI component module for WorkshopDateTimeCard.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */
import { useEffect, useMemo } from "react";
import { getWorkshopTimeZoneOptions } from "../../utils/workshopDateTime";

/**
 * Renders the WorkshopDateTimeCard component.
 * @param {Object} props - Component props.
 * @param {*} props.date - date prop.
 * @param {*} props.time - time prop.
 * @param {*} props.timezone - timezone prop.
 * @param {*} props.onDateChange - onDateChange prop.
 * @param {*} props.onTimeChange - onTimeChange prop.
 * @param {*} props.onTimezoneChange - onTimezoneChange prop.
 * @returns {JSX.Element|null} Rendered component output.
 *
 * @example
 * import WorkshopDateTimeCard from "../components/workshop-invitation/WorkshopDateTimeCard";
 *
 * // Real usage reference: src/pages/innovation/WorkshopInvitation.jsx
 * <WorkshopDateTimeCard />;
 */
function WorkshopDateTimeCard({
  date,
  time,
  timezone,
  onDateChange,
  onTimeChange,
  onTimezoneChange,
}) {
  const todayDate = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);
  const currentTime = useMemo(() => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  }, []);

  useEffect(() => {
    if (!date) {
      onDateChange(todayDate);
    }
  }, [date, onDateChange, todayDate]);

  useEffect(() => {
    if (!time) {
      onTimeChange(currentTime);
    }
  }, [time, onTimeChange, currentTime]);

  const timezoneOptions = useMemo(
    () => getWorkshopTimeZoneOptions(timezone, { date, time }),
    [timezone, date, time]
  );

  return (
    <div className="bg-white/80 backdrop-blur rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
      <label className="block text-sm font-medium text-slate-700 mb-3">
        Date et heure de l’atelier
      </label>

      <div className="grid grid-cols-3 gap-3">
        <input
          type="date"
          value={date || todayDate}
          onChange={(event) => onDateChange(event.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />

        <input
          type="time"
          value={time || currentTime}
          onChange={(event) => onTimeChange(event.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
        <select
          value={timezone}
          onChange={(event) => onTimezoneChange(event.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          {timezoneOptions.map((zone) => (
            <option key={zone.value} value={zone.value}>
              {zone.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default WorkshopDateTimeCard;
