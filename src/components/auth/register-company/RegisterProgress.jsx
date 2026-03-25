/**
 * @module components/auth/register-company/RegisterProgress
 * @description UI component module for RegisterProgress.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */
/**
 * Renders the RegisterProgress component.
 * @param {Object} props - Component props.
 * @param {*} props.step - step prop.
 * @returns {JSX.Element|null} Rendered component output.
 *
 * @example
 * import RegisterProgress from "../components/auth/register-company/RegisterProgress";
 *
 * // Real usage reference: src/pages/auth/RegisterCompany.jsx
 * <RegisterProgress />;
 */
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
