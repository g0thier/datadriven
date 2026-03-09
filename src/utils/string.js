/**
 * Creates a URL-friendly slug from a given string.
 * @param {string} value - The string to be converted into a slug.
 * @returns {string} - The URL-friendly slug.
 */
const slugify = (value) => {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

export default slugify;