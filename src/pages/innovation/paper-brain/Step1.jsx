import { useState } from "react";
import WorkshopStepLayout from "./WorkshopStepLayout.jsx";

export default function Step1({ sessionTitle, step }) {
  const [description, setDescription] = useState("");

  return (
    <WorkshopStepLayout
      title={sessionTitle}
      stepLabel={step.label}
      description={step.description}
    >
      <textarea
        className="w-full h-40 p-4 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Écrivez votre description ici..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
    </WorkshopStepLayout>
  );
}