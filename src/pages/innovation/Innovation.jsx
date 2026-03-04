import Navbar from '../../components/Navbar.jsx'
import data from './data_cards.jsx'

function Cards() {
  return (
      <div className="max-w-7xl mx-auto grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((card, index) => (
          <div
            key={index}
            className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden hover:-translate-y-2"
          >
            {/* Image */}
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

            {/* Content */}
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
                    <li
                      key={idx}
                      className="flex items-start gap-2"
                    >
                      <span className="text-indigo-500 mt-1">✔</span>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-indigo-400 py-2 rounded-xl font-medium transition-colors duration-300">
                Proposer cette activité
              </button>
            </div>
          </div>
        ))}
      </div>
  );
}


function Innovation() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-200 py-12 px-6">
        <h1 className='text-4xl font-bold text-gray-800 mb-8'>Innovation & Créativité</h1>
        <Cards />
      </div>
    </>
  );
}

export default Innovation;