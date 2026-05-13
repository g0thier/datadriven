/**
 * @module workshops/workshopRuntimeBridges
 * @description Enregistre dynamiquement les bridges runtime de collaboration par atelier.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

const WORKSHOP_DATA_MODULES = import.meta.glob("./*/data.js", {
  eager: true,
  import: "default",
});

const WORKSHOP_COLLABORATION_MODULES = import.meta.glob("./*/useCollaboration.js", {
  eager: true,
});

/**
 * Crée le composant bridge qui initialise le hook de collaboration d'un atelier
 * puis transmet l'état via render-prop.
 *
 * @param {(params:{sessionId:string,session:Object,workshopId:string}) => Object} useWorkshopCollaboration - Hook de collaboration atelier.
 * @returns {function({sessionId:string,session:Object,workshopId:string,children:function}): (JSX.Element|null)}
 */
const createWorkshopBridge = (useWorkshopCollaboration) =>
  function WorkshopRuntimeBridge({ sessionId, session, workshopId, children }) {
    const collaboration = useWorkshopCollaboration({ sessionId, session, workshopId });
    return typeof children === "function" ? children(collaboration) : null;
  };

/**
 * Extrait le nom de dossier atelier depuis un chemin `./<folder>/data.js`.
 *
 * @param {string} modulePath - Chemin module renvoyé par `import.meta.glob`.
 * @returns {string} Le dossier atelier, ou chaîne vide si non déterminable.
 */
const extractWorkshopFolder = (modulePath) => String(modulePath || "").split("/")[1] || "";

/**
 * Mapping des bridges runtime de collaboration par identifiant atelier.
 *
 * Clé: `workshop.id` défini dans `data.js`.
 * Valeur: composant bridge injectant `collaboration` au render-prop enfant.
 *
 * @type {Object<string, function>}
 */
export const WORKSHOP_BRIDGES = Object.entries(WORKSHOP_DATA_MODULES).reduce(
  (accumulator, [dataPath, workshop]) => {
    const workshopId = String(workshop?.id || "").trim();
    if (!workshopId) return accumulator;

    const workshopFolder = extractWorkshopFolder(dataPath);
    const hookModulePath = `./${workshopFolder}/useCollaboration.js`;
    const useWorkshopCollaboration =
      WORKSHOP_COLLABORATION_MODULES[hookModulePath]?.useCollaboration;
    if (typeof useWorkshopCollaboration !== "function") {
      if (import.meta.env.DEV) {
        console.warn(
          `[workshops] useCollaboration introuvable ou invalide pour "${workshopId}" (${hookModulePath}).`
        );
      }
      return accumulator;
    }

    accumulator[workshopId] = createWorkshopBridge(useWorkshopCollaboration);
    return accumulator;
  },
  {}
);
