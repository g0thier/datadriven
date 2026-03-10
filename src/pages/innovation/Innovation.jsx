import Navbar from "../../components/Navbar.jsx";
import Cards from "../../components/innovation/Cards.jsx";


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
