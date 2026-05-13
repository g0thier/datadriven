import WorkshopStepLayout from "./WorkshopStepLayout.jsx";
import WorkshopSyncErrorAlert from "../../components/workshops/WorkshopSyncErrorAlert.jsx";

export default function WorkshopChallenge({ sessionTitle, step, collaboration }) {
  const description = collaboration?.description ?? "";
  const isLoading = Boolean(collaboration?.isLoading);
  const syncError = collaboration?.syncError || "";
  const placeholder = "Décrivez le sujet de l'atelier...";
  const challengeFooterImage = String(step?.challengeFooterImage || "").trim();
  const challengeFooterAlt = String(step?.challengeFooterAlt || "Support visuel atelier");

  const handleChange = (event) => {
    const nextDescription = event.target.value;
    if (isLoading || nextDescription === description) return;

    collaboration?.actions?.setDescription?.(nextDescription, description);
  };

  return (
    <WorkshopStepLayout title={sessionTitle} stepLabel={step.label} description={step.description}>
      <WorkshopSyncErrorAlert message={syncError} className="mb-3" />

      <textarea
        className="w-full h-40 p-4 bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder={placeholder}
        disabled={isLoading}
        value={description}
        onChange={handleChange}
      />

      {challengeFooterImage ? (
        <div className="mt-4 bg-white rounded-2xl shadow-md overflow-hidden">
          <img
            src={challengeFooterImage}
            alt={challengeFooterAlt}
            className="w-full h-auto object-contain"
          />
        </div>
      ) : null}
    </WorkshopStepLayout>
  );
}
