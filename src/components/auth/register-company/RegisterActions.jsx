import MaterialIcon from "../../MaterialIcon";

export default function RegisterActions({
  step,
  canGoNext,
  isSubmitting,
  onBack,
}) {
  return (
    <div className="flex items-center gap-4 mt-4">
      {step > 1 && (
        <button
          type="button"
          onClick={onBack}
          className="bg-white text-gray-800 p-4 rounded-full shadow-md hover:bg-gray-50 transition flex items-center justify-center"
          aria-label="Retour"
          disabled={isSubmitting}
        >
          <MaterialIcon name="arrow_back" size={24} />
        </button>
      )}

      <button
        type="submit"
        disabled={!canGoNext || isSubmitting}
        className={
          "bg-indigo-500 text-white p-4 rounded-full shadow-md transition flex items-center justify-center " +
          (canGoNext && !isSubmitting
            ? "hover:bg-indigo-600"
            : "opacity-50 cursor-not-allowed")
        }
        aria-label={step < 5 ? "Continuer" : "Créer le compte"}
      >
        <MaterialIcon
          name={step === 3 ? "password" : step < 5 ? "arrow_right_alt" : "send"}
          size={24}
          className={
            "h-6 w-6 brightness-0 invert " +
            (step === 5 ? "rotate-330 -translate-y-px translate-px" : "")
          }
        />
      </button>
    </div>
  );
}
