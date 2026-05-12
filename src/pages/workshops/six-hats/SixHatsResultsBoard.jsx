import { BLUE_HAT_CONFIG, HAT_CONFIG } from "./sixHats.constants";
import WorkshopInfoCard from "../../../components/workshops/WorkshopInfoCard.jsx";

const EMPTY_ARRAY = Object.freeze([]);

export default function SixHatsResultsBoard({
  step1Description = "",
  itemsByHat = {},
  blueConclusion = "",
  isBlueEditable = false,
  isLoading = false,
  onBlueConclusionChange,
}) {
  const challenge =
    String(step1Description || "").trim() ||
    "Le sujet n'a pas été renseigné pendant l'atelier.";

  const normalizedBlueConclusion = String(blueConclusion || "");

  const handleBlueConclusionChange = (event) => {
    const nextValue = event.target.value;
    if (!isBlueEditable) return;
    if (nextValue === normalizedBlueConclusion) return;
    onBlueConclusionChange?.(nextValue);
  };

  return (
    <div className="space-y-4">
      <WorkshopInfoCard title="Sujet de l'atelier">
        <p className="text-gray-600 whitespace-pre-wrap">{challenge}</p>
      </WorkshopInfoCard>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
        {HAT_CONFIG.map((hat) => {
          const hatItems = Array.isArray(itemsByHat?.[hat.id]) ? itemsByHat[hat.id] : EMPTY_ARRAY;
          const nonEmptyHatItems = hatItems.filter((item) => String(item?.text || "").trim());

          return (
            <section
              key={hat.id}
              className={`rounded-2xl border p-4 ${hat.columnBgClass} ${hat.borderClass}`}
            >
              <h3 className="text-sm font-semibold text-gray-700 mb-3">{hat.label}</h3>

              {nonEmptyHatItems.length === 0 ? (
                <p className="text-sm text-gray-500">Aucune contribution.</p>
              ) : (
                <div className="space-y-2">
                  {nonEmptyHatItems.map((item) => (
                    <article key={item.id} className={`rounded-lg p-3 ${hat.noteBgClass}`}>
                      <p className="text-gray-700 text-sm whitespace-pre-wrap">{item.text}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <section
        className={`rounded-2xl border p-4 ${BLUE_HAT_CONFIG.columnBgClass} ${BLUE_HAT_CONFIG.borderClass}`}
      >
        <h3 className="text-sm font-semibold text-gray-700 mb-3">{BLUE_HAT_CONFIG.label}</h3>

        {isBlueEditable ? (
          <textarea
            className="w-full h-40 p-4 bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Synthèse finale, décisions et prochaines actions..."
            value={normalizedBlueConclusion}
            onChange={handleBlueConclusionChange}
            disabled={isLoading}
          />
        ) : (
          <div className={`rounded-lg p-4 ${BLUE_HAT_CONFIG.noteBgClass}`}>
            <p className="text-gray-700 text-sm whitespace-pre-wrap">
              {normalizedBlueConclusion || <span className="text-gray-400">Aucune conclusion rédigée.</span>}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
