import WorkshopSummaryLayout from "../../../components/workshops/WorkshopSummaryLayout.jsx";
import WorkshopInfoCard from "../../../components/workshops/WorkshopInfoCard.jsx";
import WorkshopSyncErrorAlert from "../../../components/workshops/WorkshopSyncErrorAlert.jsx";
/**
 * @module workshops/matrice-croisee/MatriceCroiseeSummary
 * @description Workshop-specific summary view for the Matrice croisee workflow.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

const COLUMN_PLACEHOLDERS = ["Enfants", "Adultes", "Seniors"];
const ROW_PLACEHOLDERS = ["mobile", "tablette", "ordinateur"];

const getColumnPlaceholder = (index) => COLUMN_PLACEHOLDERS[index] || `Colonne ${index + 1}`;
const getRowPlaceholder = (index) => ROW_PLACEHOLDERS[index] || `Rang ${index + 1}`;

/**
 * Renders the Matrice croisee workshop summary screen.
 *
 * @param {Object} props - Component props.
 * @param {string} props.sessionTitle - Workshop session title.
 * @param {Object} props.collaboration - Collaboration state from useMatriceCroiseeCollaboration.
 * @returns {JSX.Element} The rendered Matrice croisee summary.
 */
export default function MatriceCroiseeSummary({ sessionTitle, collaboration }) {
  const syncError = collaboration?.syncError || "";
  const selectedTopIdea = collaboration?.selectedTopIdea || null;
  const concept = String(collaboration?.concept || "").trim();

  const challenge =
    String(collaboration?.description || "").trim() ||
    "Le défi n'a pas été renseigné pendant l'atelier.";

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
    <WorkshopSummaryLayout sessionTitle={sessionTitle}>
      <WorkshopInfoCard title="Sujet de l'atelier" className="mb-6">
        <p className="text-gray-600 whitespace-pre-wrap">{challenge}</p>
      </WorkshopInfoCard>

      <WorkshopSyncErrorAlert message={syncError} className="mb-4" />

      <WorkshopInfoCard title="Fiche finale">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <article className="rounded-xl border border-violet-200 bg-violet-50 p-4">
            <p className="text-xs uppercase tracking-wide text-violet-700 mb-1">Entête de colonne</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {columnText || <span className="text-gray-400">Entête de colonne vide.</span>}
            </p>
          </article>

          <article className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-xs uppercase tracking-wide text-blue-700 mb-1">Entête de ligne</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {rowText || <span className="text-gray-400">Entête de ligne vide.</span>}
            </p>
          </article>

          <article className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs uppercase tracking-wide text-amber-700 mb-1">Idée retenue</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {noteText || <span className="text-gray-400">Aucune idée votée.</span>}
            </p>
          </article>

          <article className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs uppercase tracking-wide text-emerald-700 mb-1">
              Développement du concept
            </p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {concept || <span className="text-gray-400">Aucun concept rédigé.</span>}
            </p>
          </article>
        </div>
      </WorkshopInfoCard>
    </WorkshopSummaryLayout>
  );
}
