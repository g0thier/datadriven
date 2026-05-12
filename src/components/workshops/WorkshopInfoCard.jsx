/**
 * @module components/workshops/WorkshopInfoCard
 * @description Shared informational card for workshop pages.
 */

export default function WorkshopInfoCard({
  title,
  children,
  className = "",
  titleClassName = "text-lg font-semibold text-gray-700 mb-2",
  bodyClassName = "",
}) {
  const mergedClassName = ["bg-white rounded-2xl shadow-md p-6", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={mergedClassName}>
      {title ? <h2 className={titleClassName}>{title}</h2> : null}

      {bodyClassName ? <div className={bodyClassName}>{children}</div> : children}
    </div>
  );
}
