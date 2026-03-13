import { useMemo } from "react";
import { getWorkshopTimeZoneOptions } from "../../utils/workshopDateTime";

function WorkshopDateTimeCard({
  date,
  time,
  timezone,
  onDateChange,
  onTimeChange,
  onTimezoneChange,
}) {
  const timezoneOptions = useMemo(
    () => getWorkshopTimeZoneOptions(timezone),
    [timezone]
  );

  return (
    <div className="bg-white/80 backdrop-blur rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
      <label className="block text-sm font-medium text-slate-700 mb-3">
        Date et heure de l’atelier
      </label>

      <div className="grid grid-cols-3 gap-3">
        <input
          type="date"
          value={date}
          onChange={(event) => onDateChange(event.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />

        <input
          type="time"
          value={time}
          onChange={(event) => onTimeChange(event.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
        <select
          value={timezone}
          onChange={(event) => onTimezoneChange(event.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          {timezoneOptions.map((zone) => (
            <option key={zone} value={zone}>
              {zone}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default WorkshopDateTimeCard;
