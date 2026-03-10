export default function RegisterProgress({ step }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {[1, 2, 3, 4, 5].map((value) => (
        <div
          key={value}
          className={
            "h-2 w-10 rounded-full " +
            (step >= value ? "bg-indigo-600" : "bg-indigo-200")
          }
        />
      ))}
    </div>
  );
}
