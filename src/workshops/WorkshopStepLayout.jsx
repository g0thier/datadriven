export default function WorkshopStepLayout({ title, stepLabel, description, children }) {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-200 py-12 px-6">
      {/* on réserve la place de la sidebar fixed (w-80 ~ 20rem) */}
      <div className="min-h-screen pr-86">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">{title}</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">{stepLabel}</h2>

        {!!description?.length && (
          <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
            {description.map((item, index) => (
              <p key={index} className="text-gray-600 mb-1 text-sm">
                {item}
              </p>
            ))}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}