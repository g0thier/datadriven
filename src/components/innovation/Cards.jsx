/**
 * @module components/innovation/Cards
 * @description UI component module for Cards.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */
import { useNavigate } from "react-router-dom";

import { WORKSHOPS } from "../../workshops/index.js";

function getWorkshopTotalDurationMinutes(workshop) {
  const steps = Array.isArray(workshop?.steps) ? workshop.steps : [];

  return steps.reduce((total, step) => {
    const duration = Number(step?.duration);
    return Number.isFinite(duration) ? total + duration : total;
  }, 0);
}

function formatWorkshopDuration(workshop) {
  const totalMinutes = getWorkshopTotalDurationMinutes(workshop);
  if (totalMinutes > 0) return `${totalMinutes} minutes`;

  const fallbackDuration = String(workshop?.duration || "").trim();
  return fallbackDuration || "Durée non définie";
}

/**
 * Renders the Cards component.
 * @returns {JSX.Element|null} Rendered component output.
 *
 * @example
 * import Cards from "../components/innovation/Cards";
 *
 * // Real usage reference: src/pages/innovation/Innovation.jsx
 * <Cards />;
 */
function Cards() {
  const navigate = useNavigate();
  const workshopCards = Object.values(WORKSHOPS || {});

  return (
    <div className="max-w-7xl mx-auto grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {workshopCards.map((card) => (
        <div
          key={card.id}
          onClick={() =>
            navigate("/innovation/invitation", { state: { workshop: card } })
          }
          className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden hover:-translate-y-2"
        >
          <div className="relative h-48 overflow-hidden">
            <img
              src={card.image}
              alt={card.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent"></div>
            <h2 className="absolute bottom-4 left-4 text-white text-xl font-bold">
              {card.title}
            </h2>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex justify-between text-sm text-gray-500">
              <span>⏱ {formatWorkshopDuration(card)}</span>
              <span>👥 {card.groupSize}</span>
            </div>

            <div>
              <p className="font-semibold text-gray-700 mb-2">
                Quand l'utiliser :
              </p>
              <ul className="space-y-1 text-gray-600 text-sm">
                {card.benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-indigo-500 mt-1">✔</span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Cards;
