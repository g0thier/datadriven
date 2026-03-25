/**
 * @module utils/workshopInvitationNormalizers
 * @description Normalizers for workshop invitation departments and members.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

/**
 * Resolves a stable identifier from common id fields.
 * @param {Object} obj - Source object.
 * @param {number|string} fallbackIndex - Fallback identifier.
 * @returns {string|number} Resolved identifier.
 */
export const getId = (obj, fallbackIndex) =>
  obj?.id ?? obj?._id ?? obj?.slug ?? obj?.code ?? String(fallbackIndex);

/**
 * Resolves a department label from common naming fields.
 * @param {Object} department - Department object.
 * @returns {string} Department label.
 */
export const getDeptLabel = (department) =>
  department?.name ??
  department?.label ??
  department?.title ??
  department?.department ??
  "Département";

/**
 * Resolves a member display label, including email when available.
 * @param {Object} member - Member object.
 * @returns {string} Member label.
 */
export const getMemberLabel = (member) => {
  const fullName =
    member?.fullName ??
    member?.name ??
    [member?.firstName, member?.lastName].filter(Boolean).join(" ") ??
    member?.title ??
    "Membre";

  const email = member?.email ?? member?.mail ?? "";
  return email ? `${fullName} — ${email}` : fullName;
};

/**
 * Adds normalized identifier and label fields to department entries.
 * @param {Object[]} [items=[]] - Department list.
 * @returns {Object[]} Normalized department list.
 */
export const normalizeDepartments = (items = []) =>
  items.map((department, index) => ({
    ...department,
    __id: getId(department, index),
    __label: getDeptLabel(department),
  }));

/**
 * Adds normalized identifier and label fields to member entries.
 * @param {Object[]} [items=[]] - Member list.
 * @returns {Object[]} Normalized member list.
 */
export const normalizeMembers = (items = []) =>
  items.map((member, index) => ({
    ...member,
    __id: getId(member, index),
    __label: getMemberLabel(member),
  }));

/**
 * Toggles an item id in an array and returns a new array.
 * @param {Array<string|number>} items - Current ids.
 * @param {string|number} id - Id to toggle.
 * @returns {Array<string|number>} Updated ids.
 */
export const toggleInArray = (items, id) =>
  items.includes(id) ? items.filter((item) => item !== id) : [...items, id];
