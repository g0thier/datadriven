/**
 * @module workshops/design-thinking/steps/Step3
 * @description Design Thinking step 3 screen for problem statement definition.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import { useMemo } from "react";
import WorkshopStepLayout from "../../WorkshopStepLayout.jsx";

/**
 * Renders Design Thinking step 3 (problem statement definition).
 *
 * @param {Object} props - Component props.
 * @param {string} props.sessionTitle - Current session title.
 * @param {Object} props.step - Step metadata (label, description, duration, etc.).
 * @param {Object} props.collaboration - Collaboration state and actions.
 * @returns {JSX.Element} The rendered step 3 screen.
 */
export default function Step3({ sessionTitle, step, collaboration }) {
  const sharedNotes = useMemo(
    () => (Array.isArray(collaboration?.sharedNotes) ? collaboration.sharedNotes : []),
    [collaboration]
  );

  const challenge =
    String(collaboration?.step1Description || "").trim() ||
    "Le défi sera visible ici dès qu'il est défini à l'étape 1.";
  const problemStatement = String(collaboration?.problemStatement || "");
  const isLoading = Boolean(collaboration?.isLoading);
  const syncError = collaboration?.syncError || "";

  const handleChange = (event) => {
    const nextStatement = event.target.value;
    if (isLoading || nextStatement === problemStatement) return;

    collaboration?.actions?.setProblemStatement?.(nextStatement, problemStatement);
  };

  return (
    <WorkshopStepLayout title={sessionTitle} stepLabel={step.label} description={step.description}>
      <div className="bg-white rounded-2xl shadow-md p-6 mb-4">
        <h3 className="text-base font-semibold text-gray-800 mb-2">Définition du défi</h3>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{challenge}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-md p-6 mb-4">
        <h3 className="text-base font-semibold text-gray-800 mb-2">Empathie</h3>
        {sharedNotes.length === 0 ? (
          <p className="text-sm text-gray-500">
            Les prises de note de la phase Empathie apparaîtront ici.
          </p>
        ) : (
          <ul className="space-y-2">
            {sharedNotes.map((note) => (
              <li key={note.id} className="flex items-start gap-2 text-sm text-gray-700">
                <span
                  className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gray-400 shrink-0"
                  aria-hidden="true"
                />
                <p className="whitespace-pre-wrap">{String(note.text || "").trim() || "-"}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!!syncError && (
        <p className="mb-3 text-sm text-red-600" role="alert">
          {syncError}
        </p>
      )}

      <textarea
        className="w-full h-40 p-4 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Rédigez la problématique commune ici..."
        disabled={isLoading}
        value={problemStatement}
        onChange={handleChange}
      />
    </WorkshopStepLayout>
  );
}
