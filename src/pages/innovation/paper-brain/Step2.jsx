import { useState } from "react";
import { data } from "../../../components/StepTimeData";

function Step2() {
  const [description, setDescription] = useState("");

  const challenge = "Comment pourrions-nous inventer un produit antistress pour cadres en burn-out ?";
  const [notes, setNotes] = useState([""]);

  const handleChange = (index, value) => {
    const updatedNotes = [...notes];
    updatedNotes[index] = value;
    setNotes(updatedNotes);
  };

  const addNote = () => {
    setNotes([...notes, ""]);
  };

  const removeNote = (index) => {
    const updatedNotes = notes.filter((_, i) => i !== index);
    setNotes(updatedNotes);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-200 py-12 px-6">
      <div className="min-h-screen lg:mr-86">

        <h1 className='text-4xl font-bold text-gray-800 mb-8'>{data.title}</h1>
        <h2 className='text-2xl font-semibold text-gray-700 mb-4'>{data.steps[1].label}</h2>
        {/* description de l'étape */}
        <div className='bg-white rounded-2xl shadow-md p-6 mb-6'>
          {data.steps[1].description.map((item, index) => (
            <p key={index} className='text-gray-600 mb-1 text-sm'>{item}</p>
          ))}
        </div>

        {/* challenge proposé */}
        <div className='bg-white rounded-2xl shadow-md p-6 mb-6'>
          <p className='text-gray-600 mb-1 text-sm'>{challenge}</p>
        </div>

        {/* Zone des post-it */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {notes.map((note, index) => (
            <div
              key={index}
              className="relative bg-yellow-100 rounded-lg shadow-md p-4 min-h-[150px] flex flex-col"
            >
              <textarea
                className="flex-1 bg-transparent resize-none focus:outline-none text-gray-800"
                placeholder="Écrivez une idée..."
                value={note}
                onChange={(e) => handleChange(index, e.target.value)}
              />

              {notes.length > 1 && (
                <button
                  onClick={() => removeNote(index)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-sm"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        {/* Bouton ajouter */}
        <div className="mt-8">
          <button
            onClick={addNote}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 transition"
          >
            + Ajouter un post-it
          </button>
        </div>

    </div>
    </div>
  );
}

export default Step2;