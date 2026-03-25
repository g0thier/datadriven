import { useEffect, useMemo, useState } from "react";
import {
  getUserCompanyId,
  onAuthStateChangedListener,
  subscribeCompanyMembers,
  upsertCompanyManagerPermissions,
  updateCompanyMember,
} from "../../firebase";

/**
 * @module hooks/management/useCompanyCollaborators
 * @description Hook to list collaborators and promote them to leader role.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

/**
 * Normalizes a role string.
 * @param {string} role - Raw role value.
 * @returns {string} Normalized role.
 */
const normalizeRole = (role) => String(role || "").trim().toLowerCase();

/**
 * Resolves a stable collaborator identifier from a member payload.
 * @param {Object} member - Member payload.
 * @param {number} index - Fallback index.
 * @returns {string|number} Resolved collaborator id.
 */
const getCollaboratorId = (member, index) =>
  member?.id ?? member?._id ?? member?.uid ?? member?.email ?? `collaborator-${index}`;

/**
 * Resolves a display name for a collaborator.
 * @param {Object} member - Member payload.
 * @returns {string} Display name.
 */
const getCollaboratorDisplayName = (member) =>
  [member?.firstName, member?.lastName].filter(Boolean).join(" ").trim() ||
  member?.name ||
  member?.fullName ||
  "Collaborateur";

/**
 * Builds a searchable collaborator label combining name and email.
 * @param {Object} member - Member payload.
 * @returns {string} Search label.
 */
const getCollaboratorSearchLabel = (member) => {
  const displayName = getCollaboratorDisplayName(member);
  const email = member?.email || member?.mail || "";

  return email ? `${displayName} — ${email}` : displayName;
};

/**
 * Exposes collaborator list data and promotion actions.
 * @returns {Object} Collaborators view-model, action state and handlers.
 */
export default function useCompanyCollaborators() {
  const [companyId, setCompanyId] = useState(null);
  const [memberRecords, setMemberRecords] = useState([]);
  const [promotingCollaboratorId, setPromotingCollaboratorId] = useState("");
  const [promotionError, setPromotionError] = useState("");

  const collaborators = useMemo(() => {
    const source = Array.isArray(memberRecords) ? memberRecords : [];

    return source
      .filter((member) => normalizeRole(member?.role) === "colab")
      .map((member, index) => ({
        ...member,
        collaboratorId: String(getCollaboratorId(member, index)),
        displayName: getCollaboratorDisplayName(member),
        searchLabel: getCollaboratorSearchLabel(member),
      }));
  }, [memberRecords]);

  async function promoteCollaborator(collaboratorId) {
    const nextId = String(collaboratorId || "").trim();
    if (!companyId || !nextId) return;

    setPromotingCollaboratorId(nextId);
    setPromotionError("");

    try {
      await updateCompanyMember(companyId, nextId, { role: "leader" });
      await upsertCompanyManagerPermissions(companyId, nextId, { role: "leader" });
    } catch (error) {
      console.error("Impossible de promouvoir le collaborateur en leader :", error);
      setPromotionError("Impossible de passer ce collaborateur en leader.");
    } finally {
      setPromotingCollaboratorId("");
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChangedListener(async (currentUser) => {
      if (!currentUser) {
        setCompanyId(null);
        setMemberRecords([]);
        return;
      }

      try {
        const nextCompanyId = await getUserCompanyId(currentUser.uid);
        setCompanyId(nextCompanyId || null);

        if (!nextCompanyId) {
          setMemberRecords([]);
        }
      } catch (error) {
        console.error("Impossible de récupérer le companyId de l'utilisateur :", error);
        setCompanyId(null);
        setMemberRecords([]);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeCompanyMembers(companyId, setMemberRecords);
    return () => unsubscribe();
  }, [companyId]);

  return {
    collaborators,
    promoteCollaborator,
    promotingCollaboratorId,
    promotionError,
  };
}
