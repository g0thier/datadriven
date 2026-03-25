import { useEffect, useMemo, useState } from "react";
import {
  getUserCompanyId,
  onAuthStateChangedListener,
  subscribeCompanyManagers,
  upsertCompanyManagerPermissions,
  updateCompanyMember,
} from "../../firebase";
import { buildManagerList } from "../../utils/managers.utils.js";

/**
 * @module hooks/management/useCompanyManagers
 * @description Hook to list managers and demote them back to collaborator role.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

/**
 * Exposes manager list data and demotion actions.
 * @returns {Object} Managers view-model, action state and handlers.
 */
export default function useCompanyManagers() {
  const [companyId, setCompanyId] = useState(null);
  const [managerRecords, setManagerRecords] = useState([]);
  const [demotingManagerId, setDemotingManagerId] = useState("");
  const [demotionError, setDemotionError] = useState("");
  const managers = useMemo(() => buildManagerList(managerRecords), [managerRecords]);

  async function demoteManager(managerId) {
    const nextId = String(managerId || "").trim();
    if (!companyId || !nextId) return;

    setDemotingManagerId(nextId);
    setDemotionError("");

    try {
      await updateCompanyMember(companyId, nextId, { role: "colab" });
      await upsertCompanyManagerPermissions(companyId, nextId, { role: "colab" });
    } catch (error) {
      console.error("Impossible de passer ce leader en collaborateur :", error);
      setDemotionError("Impossible de retirer ce leader pour le moment.");
    } finally {
      setDemotingManagerId("");
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChangedListener(async (currentUser) => {
      if (!currentUser) {
        setCompanyId(null);
        setManagerRecords([]);
        return;
      }

      try {
        const nextCompanyId = await getUserCompanyId(currentUser.uid);
        setCompanyId(nextCompanyId || null);

        if (!nextCompanyId) {
          setManagerRecords([]);
        }
      } catch (error) {
        console.error("Impossible de récupérer le companyId de l'utilisateur :", error);
        setCompanyId(null);
        setManagerRecords([]);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeCompanyManagers(companyId, setManagerRecords);
    return () => unsubscribe();
  }, [companyId]);

  return {
    companyId,
    managers,
    demoteManager,
    demotingManagerId,
    demotionError,
  };
}
