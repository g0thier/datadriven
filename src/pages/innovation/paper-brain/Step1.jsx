import { useState } from "react";
import { data } from "../../../components/StepTimeData";

function Step1() {
  const [description, setDescription] = useState("");

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-200 py-12 px-6">
      <div className="min-h-screen lg:mr-86">

        <h1 className='text-4xl font-bold text-gray-800 mb-8'>{data.title}</h1>
        <h2 className='text-2xl font-semibold text-gray-700 mb-4'>{data.steps[0].label}</h2>
        {/* description de l'étape */}
        <div className='bg-white rounded-2xl shadow-md p-6 mb-6'>
          {data.steps[0].description.map((item, index) => (
            <p key={index} className='text-gray-600 mb-1 text-sm'>{item}</p>
          ))}
        </div>
        {/* textarea pour que l'utilisateur puisse ecrire sa description de l'innovation */}
        <textarea
          className="w-full h-40 p-4 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Écrivez votre description ici..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
    </div>
    </div>
  );
}

export default Step1;