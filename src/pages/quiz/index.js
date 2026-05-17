/**
 * @module pages/quiz/index
 * @description Quiz registry exports used to list and resolve available motivation quizzes.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

const QUIZ_DATA_MODULES = import.meta.glob("./*/data.json", {
  eager: true,
  import: "default",
});

const QUIZ_IMAGE_MODULES = import.meta.glob("../../assets/quiz/*.{png,jpg,jpeg,webp,avif,svg}", {
  eager: true,
  import: "default",
});

const QUIZ_ORDER = [
  "theorie-x-y",
  "identite-pro",
  "pyramide-besoins",
  "autodetermination",
  "attentes",
  "equite",
  "besoins-acquis",
  "mimetisme",
];

function extractFolderFromPath(path) {
  const match = /^\.\/([^/]+)\//.exec(path);
  return match?.[1] || "";
}

function extractFileName(path) {
  const normalizedPath = String(path || "").split("?")[0];
  const parts = normalizedPath.split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
}

const quizImageByFileName = Object.entries(QUIZ_IMAGE_MODULES).reduce(
  (accumulator, [path, imageUrl]) => {
    accumulator[extractFileName(path)] = imageUrl;
    return accumulator;
  },
  {}
);

function resolveQuizImage(rawQuiz = {}, folderName = "") {
  const imagePath = String(rawQuiz?.image || "").trim();
  const imageFileName = extractFileName(imagePath);

  if (imageFileName && quizImageByFileName[imageFileName]) {
    return quizImageByFileName[imageFileName];
  }

  const fallbackFileName = `${folderName}.png`;
  return quizImageByFileName[fallbackFileName] || "";
}

const quizByIdUnordered = {};

for (const [path, data] of Object.entries(QUIZ_DATA_MODULES)) {
  if (!data || typeof data !== "object") continue;

  const folderName = extractFolderFromPath(path);
  if (!folderName) continue;

  const quizId = String(data.id || folderName).trim();
  if (!quizId) continue;

  quizByIdUnordered[quizId] = {
    ...data,
    id: quizId,
    title: data.titre || data.nom || quizId,
    name: data.nom || data.titre || quizId,
    description: data.description || "",
    author: data.auteur || "",
    image: resolveQuizImage(data, folderName),
  };
}

const orderedQuizIds = [...new Set([...QUIZ_ORDER, ...Object.keys(quizByIdUnordered)])].filter(
  (quizId) => Boolean(quizByIdUnordered[quizId])
);

/**
 * Registry object containing all available quiz configurations.
 * @type {Object<string, Object>}
 */
export const QUIZZES = orderedQuizIds.reduce((accumulator, quizId) => {
  accumulator[quizId] = quizByIdUnordered[quizId];
  return accumulator;
}, {});

/**
 * Resolves a quiz configuration by id.
 * @param {string} id - Quiz id.
 * @returns {Object|undefined} Quiz configuration object, or undefined when unknown.
 */
export function getQuiz(id) {
  return QUIZZES[id];
}
