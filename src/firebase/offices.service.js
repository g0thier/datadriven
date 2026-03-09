import { onValue, push, ref, remove, set, update } from "firebase/database";
import { database } from "./app";

export const subscribeCompanyOffices = (companyId, callback) => {
  if (!companyId) {
    callback([]);
    return () => {};
  }

  const addressesRef = ref(database, `companies/${companyId}/addresses`);
  return onValue(addressesRef, (snapshot) => {
    const rawAddresses = snapshot.val() || {};
    const offices = Object.entries(rawAddresses)
      .map(([id, data]) => ({
        id,
        name: data?.alias || "",
        address: data?.address || "",
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "fr"));

    callback(offices);
  });
};

export const addCompanyOffice = async (companyId, payload = {}) => {
  if (!companyId) throw new Error("addCompanyOffice: companyId manquant");

  const now = new Date().toISOString();
  const officeRef = push(ref(database, `companies/${companyId}/addresses`));
  const officeId = officeRef.key;

  if (!officeId) throw new Error("Impossible de générer officeId");

  await set(officeRef, {
    alias: payload.name || "",
    address: payload.address || "",
    city: "",
    zip: "",
    country: "",
    isDefault: false,
    createdAt: now,
    updatedAt: now,
  });

  return officeId;
};

export const updateCompanyOffice = async (companyId, officeId, patch = {}) => {
  if (!companyId || !officeId) return;

  const payload = {
    updatedAt: new Date().toISOString(),
  };

  if (Object.prototype.hasOwnProperty.call(patch, "name")) {
    payload.alias = patch.name;
  }
  if (Object.prototype.hasOwnProperty.call(patch, "address")) {
    payload.address = patch.address;
  }

  await update(ref(database, `companies/${companyId}/addresses/${officeId}`), payload);
};

export const removeCompanyOffice = async (companyId, officeId) => {
  if (!companyId || !officeId) return;
  await remove(ref(database, `companies/${companyId}/addresses/${officeId}`));
};
