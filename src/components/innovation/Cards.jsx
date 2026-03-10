import { useNavigate } from "react-router-dom";

import data from "../../constants/data_cards.jsx";

function Cards() {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((card, index) => (
        <div
          key={index}
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
              <span>⏱ {card.duration}</span>
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
