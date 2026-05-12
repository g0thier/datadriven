/**
 * @module components/workshops/WorkshopDescription
 * @description Shared renderer for workshop step descriptions.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

/**
 * Renders description blocks for workshop steps.
 *
 * @param {Object} props - Component props.
 * @param {Array<{type:"paragraph",text:string}|{type:"list",items:string[]}|{type:"hint",text:string}>} [props.blocks] - Description blocks.
 * @returns {JSX.Element|null} Rendered block content, or null when empty.
 */
export default function WorkshopDescription({ blocks }) {
  if (!Array.isArray(blocks) || blocks.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
      {blocks.map((block, index) => {
        if (!block || typeof block !== "object") return null;

        if (block.type === "list") {
          const items = Array.isArray(block.items)
            ? block.items.map((item) => String(item || "").trim()).filter(Boolean)
            : [];

          if (items.length === 0) return null;

          return (
            <ul key={index} className="list-disc pl-5 mb-2 text-gray-600 text-sm marker:text-gray-400">
              {items.map((item, itemIndex) => (
                <li key={itemIndex} className="mb-1">
                  {item}
                </li>
              ))}
            </ul>
          );
        }

        if (block.type === "hint") {
          const text = String(block.text || "").trim();
          if (!text) return null;

          return (
            <p key={index} className="text-gray-700 mb-1 text-sm font-medium">
              {text}
            </p>
          );
        }

        if (block.type === "paragraph") {
          const text = String(block.text || "").trim();
          if (!text) return null;

          return (
            <p key={index} className="text-gray-600 mb-1 text-sm">
              {text}
            </p>
          );
        }

        return null;
      })}
    </div>
  );
}
