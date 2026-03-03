import zebra from '../assets/zebra.svg';

function NotFound({ code = "FAIL" }) {

  return (
    <div className="w-full bg-amber-300 min-h-screen">
      
      {/* Image de fond */}
      <img 
        src={zebra} 
        alt="Zebra" 
        className="absolute bottom-0 left-0 w-[60%] h-[60%] object-cover"
      />

      {/* Contenu centré */}
      <div className="flex items-center justify-center flex-col h-screen relative text-center px-4">
        
        <h1 className="text-9xl font-bold text-gray-800 mb-6">
          {code}
        </h1>

        <p className="text-2xl text-gray-700 mb-8">
          C'est dommage ça marchait bien jusque là.
        </p>

        <a
          href="https://www.linkedin.com/in/gauthier-rammault/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-800 underline text-lg font-medium"
        >
          Se plaindre auprès du développeur.
        </a>

      </div>
    </div>
  );
}

export default NotFound;