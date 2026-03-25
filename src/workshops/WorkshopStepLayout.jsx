/**
 * @module workshops/WorkshopStepLayout
 * @description Shared layout wrapper used by workshop step screens.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

/**
 * Renders the shared workshop step layout wrapper.
 *
 * @param {Object} props - Component props.
 * @param {string} props.title - Workshop title shown in the page heading.
 * @param {string} props.stepLabel - Current step label.
 * @param {string[]} [props.description] - Optional descriptive bullet-like text displayed above content.
 * @param {JSX.Element|JSX.Element[]|string|null} props.children - Step content.
 * @returns {JSX.Element} The rendered workshop step layout.
 *
 * @example
 * import WorkshopStepLayout from "../../WorkshopStepLayout.jsx";
 *
 * // Real usage references:
 * // - src/workshops/paper-brain/steps/Step1.jsx
 * // - src/workshops/paper-brain/steps/Step2.jsx
 * // - src/workshops/paper-brain/steps/Step3.jsx
 * // - src/workshops/paper-brain/steps/Step4.jsx
 * // - src/workshops/paper-brain/steps/Step5.jsx
 * <WorkshopStepLayout title={sessionTitle} stepLabel={step.label} description={step.description}>
 *   <div />
 * </WorkshopStepLayout>;
 */
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