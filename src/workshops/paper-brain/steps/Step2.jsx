import { useState } from "react";
import WorkshopStepLayout from "../../WorkshopStepLayout.jsx";

function Step2({ step, sessionTitle }) {

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
    <WorkshopStepLayout
      title={sessionTitle}
      stepLabel={step.label}
      description={step.description}
    >

        {/* Zone des post-it */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {notes.map((note, index) => {
          const isLast = index === notes.length - 1;

          return (
            <div
              key={index}
              className="relative bg-yellow-100 rounded-lg shadow-md p-4 min-h-37.5 flex flex-col"
            >
              <textarea
                className="flex-1 bg-transparent resize-none focus:outline-none text-gray-800"
                placeholder="Écrivez une idée..."
                value={note}
                onChange={(e) => handleChange(index, e.target.value)}
              />

              {/* Bouton supprimer */}
              {notes.length > 1 && (
                <button
                  onClick={() => removeNote(index)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-sm"
                >
                  ✕
                </button>
              )}

              {/* Bouton ajouter sur le dernier post-it */}
              {isLast && (
                <button
                  onClick={addNote}
                  className="absolute bottom-3 right-3 w-8 h-8 -mb-5 -mr-5 rounded-full bg-violet-500 text-white flex items-center justify-center shadow-md hover:bg-violet-600 transition"
                >
                  +
                </button>
              )}
            </div>
          );
        })}
        </div>

    </WorkshopStepLayout>
  );
}

export default Step2;