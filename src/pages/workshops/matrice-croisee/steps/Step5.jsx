/**
 * @module workshops/matrice-croisee/steps/Step5
 * @description Matrice croisee step 5 screen for developing the top-voted idea concept.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

import WorkshopStepLayout from "../../WorkshopStepLayout.jsx";

const COLUMN_PLACEHOLDERS = ["Enfants", "Adultes", "Seniors"];
const ROW_PLACEHOLDERS = ["mobile", "tablette", "ordinateur"];

const getColumnPlaceholder = (index) => COLUMN_PLACEHOLDERS[index] || `Colonne ${index + 1}`;
const getRowPlaceholder = (index) => ROW_PLACEHOLDERS[index] || `Rang ${index + 1}`;

/**
 * Renders Matrice croisee step 5 (concept development from top-voted idea).
 *
 * @param {Object} props - Component props.
 * @param {Object} props.step - Step metadata.
 * @param {string} props.sessionTitle - Current session title.
 * @param {Object} props.collaboration - Collaboration state and actions.
 * @returns {JSX.Element} The rendered step 5 screen.
 */
export default function Step5({ step, sessionTitle, collaboration }) {
  const isLoading = Boolean(collaboration?.isLoading);
  const syncError = collaboration?.syncError || "";
  const step1Description = String(collaboration?.step1Description || "").trim() || "...";
  const concept = String(collaboration?.concept || "");
  const selectedTopIdea = collaboration?.selectedTopIdea || null;

  const handleConceptChange = (event) => {
    const nextValue = event.target.value;
    if (isLoading || nextValue === concept) return;

    collaboration?.actions?.setConcept?.(nextValue);
  };

  const rowIndex = Number(selectedTopIdea?.rowIndex);
  const columnIndex = Number(selectedTopIdea?.columnIndex);

  const columnText =
    String(selectedTopIdea?.columnText || "").trim() ||
    getColumnPlaceholder(Number.isFinite(columnIndex) ? columnIndex : 0);
  const rowText =
    String(selectedTopIdea?.rowText || "").trim() ||
    getRowPlaceholder(Number.isFinite(rowIndex) ? rowIndex : 0);
  const noteText = String(selectedTopIdea?.noteText || "").trim();

  return (
    <WorkshopStepLayout title={sessionTitle} stepLabel={step.label} description={step.description}>
      <div className="bg-white rounded-2xl shadow-md p-6 mb-4">
        <p className="text-gray-600 mb-1 text-sm">{step1Description}</p>
      </div>

      {!!syncError && (
        <p className="mb-3 text-sm text-red-600" role="alert">
          {syncError}
        </p>
      )}

      {!selectedTopIdea ? (
        <div className="bg-white rounded-2xl shadow-md p-8 text-center text-gray-500 mb-4">
          Aucune idée votée n'est disponible pour développer le concept.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-md p-6 mb-4 space-y-3">
          <div className="rounded-xl border border-violet-200 bg-violet-50 p-3">
            <p className="text-xs uppercase tracking-wide text-violet-700 mb-1">Entête de colonne</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {columnText || <span className="text-gray-400">Entête de colonne vide.</span>}
            </p>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
            <p className="text-xs uppercase tracking-wide text-blue-700 mb-1">Entête de ligne</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {rowText || <span className="text-gray-400">Entête de ligne vide.</span>}
            </p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs uppercase tracking-wide text-amber-700 mb-1">Idée retenue</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {noteText || <span className="text-gray-400">Idée vide.</span>}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-md p-6">
        <p className="text-xs text-gray-500 mb-2">Développement du concept</p>
        <textarea
          className="w-full h-40 p-4 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Développer le concept retenu..."
          value={concept}
          onChange={handleConceptChange}
          disabled={isLoading}
        />
      </div>
    </WorkshopStepLayout>
  );
}
