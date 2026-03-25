import { useMemo } from "react";
import {
  innovationLinks,
  managementLinks,
  navbarLinks,
  teamLinks,
} from "../../constants/navigationLinks.js";
import { COLAB_RESTRICTED_LINKS } from "../../constants/routeAccess.js";
import { buildUniquePageTree } from "../../utils/navigationTree.utils.js";

/**
 * @module hooks/management/useManagementPageTree
 * @description Hook to build restricted management page tree and display metadata maps.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

const MANAGEMENT_LINK_GROUPS = [navbarLinks, innovationLinks, teamLinks, managementLinks];
const MANAGEMENT_PAGE_EXCEPTIONS = ["/soon"];
const RESTRICTED_PATHS = new Set(
  (COLAB_RESTRICTED_LINKS || [])
    .map((path) => String(path || "").trim())
    .filter(Boolean)
);

/**
 * Exposes management navigation tree, leaf paths and path display metadata resolver.
 * @returns {{pageTree:Array, pageLeafPaths:string[], getPathDisplayMeta:Function}} Tree and metadata selectors.
 */
export default function useManagementPageTree() {
  const restrictedLinkGroups = useMemo(
    () =>
      MANAGEMENT_LINK_GROUPS.map((group) =>
        group.filter((link) => RESTRICTED_PATHS.has(String(link?.to || "").trim()))
      ),
    []
  );

  const pageTree = useMemo(
    () => buildUniquePageTree(restrictedLinkGroups, MANAGEMENT_PAGE_EXCEPTIONS),
    [restrictedLinkGroups]
  );

  const pageLeafPaths = useMemo(
    () =>
      pageTree.flatMap((level1) =>
        level1.children.length > 0
          ? level1.children.map((level2) => level2.path)
          : [level1.path]
      ),
    [pageTree]
  );

  const pathDisplayMetaByPath = useMemo(
    () =>
      MANAGEMENT_LINK_GROUPS.flat().reduce((map, link) => {
        if (!link?.to || map.has(link.to)) return map;
        map.set(link.to, { label: link.label, icon: link.icon });
        return map;
      }, new Map()),
    []
  );

  const getPathDisplayMeta = useMemo(
    () => (path) => pathDisplayMetaByPath.get(path) ?? { label: path, icon: "route" },
    [pathDisplayMetaByPath]
  );

  return { pageTree, pageLeafPaths, getPathDisplayMeta };
}
