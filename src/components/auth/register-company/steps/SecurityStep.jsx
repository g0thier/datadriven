const INPUT_CLASS = "bg-white p-5 rounded shadow-md w-80 md:w-[420px]";

export default function SecurityStep({ form, onChange }) {
  const hasPasswordMismatch =
    form.passwordConfirm.length > 0 && form.password !== form.passwordConfirm;

  return (
    <div className="flex flex-col gap-4 items-center w-full">
      <input
        className={INPUT_CLASS}
        name="password"
        type="password"
        required
        value={form.password}
        onChange={(event) => onChange("password", event.target.value)}
        placeholder="Mot de passe (8+ caractères)"
      />

      <input
        className={INPUT_CLASS}
        name="passwordConfirm"
        type="password"
        required
        value={form.passwordConfirm}
        onChange={(event) => onChange("passwordConfirm", event.target.value)}
        placeholder="Confirmer le mot de passe"
      />

      {hasPasswordMismatch && (
        <p className="text-sm text-red-700">Les mots de passe ne correspondent pas.</p>
      )}

      <label className="flex items-center gap-3 bg-white/70 rounded px-4 py-3 shadow-md w-80 md:w-105">
        <input
          type="checkbox"
          checked={form.acceptTerms}
          onChange={(event) => onChange("acceptTerms", event.target.checked)}
        />
        <span className="text-sm text-gray-800">
          J’accepte les conditions d’utilisation et la politique de confidentialité.
        </span>
      </label>
    </div>
  );
}
