import { useMemo } from "react";
import {
  innovationLinks,
  managementLinks,
  navbarLinks,
  teamLinks,
} from "../../constants/navigationLinks.js";
import { buildUniquePageTree } from "../../utils/navigationTree.utils.js";

const MANAGEMENT_LINK_GROUPS = [navbarLinks, innovationLinks, teamLinks, managementLinks];
const MANAGEMENT_PAGE_EXCEPTIONS = ["/soon"];

export default function useManagementPageTree() {
  const pageTree = useMemo(
    () => buildUniquePageTree(MANAGEMENT_LINK_GROUPS, MANAGEMENT_PAGE_EXCEPTIONS),
    []
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
