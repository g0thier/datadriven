/**
 * @module components/workshops/WorkshopEmptyStateCard
 * @description Shared empty state card for workshop pages.
 */

export default function WorkshopEmptyStateCard({ message, className = "" }) {
  const mergedClassName = [
    "rounded-xl border border-slate-200 p-8 text-center text-gray-500",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <div className={mergedClassName}>{message}</div>;
}
