import { get, onValue, push, ref, remove, set, update } from "firebase/database";
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
        alias: data?.alias || "",
        name: data?.alias || "",
        address: data?.address || "",
        city: data?.city || "",
        zip: data?.zip || "",
        country: data?.country || "",
        isDefault: Boolean(data?.isDefault),
        createdAt: data?.createdAt || "",
        updatedAt: data?.updatedAt || "",
      }))
      .sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        return (a.alias || "").localeCompare(b.alias || "", "fr");
      });

    callback(offices);
  });
};

export const addCompanyOffice = async (companyId, payload = {}) => {
  if (!companyId) throw new Error("addCompanyOffice: companyId manquant");

  const now = new Date().toISOString();
  const addressesRef = ref(database, `companies/${companyId}/addresses`);
  const addressesSnapshot = await get(addressesRef);
  const hasAddresses = addressesSnapshot.exists() && Object.keys(addressesSnapshot.val() || {}).length > 0;

  const officeRef = push(ref(database, `companies/${companyId}/addresses`));
  const officeId = officeRef.key;

  if (!officeId) throw new Error("Impossible de générer officeId");

  await set(officeRef, {
    alias: payload.alias ?? payload.name ?? "",
    address: payload.address || "",
    city: payload.city || "",
    zip: payload.zip || "",
    country: payload.country || "",
    isDefault: !hasAddresses,
    createdAt: now,
  });

  return officeId;
};

export const updateCompanyOffice = async (companyId, officeId, patch = {}) => {
  if (!companyId || !officeId) return;

  const payload = {
    updatedAt: new Date().toISOString(),
  };

  if (Object.prototype.hasOwnProperty.call(patch, "alias")) {
    payload.alias = patch.alias || "";
  }
  if (Object.prototype.hasOwnProperty.call(patch, "name")) {
    payload.alias = patch.name;
  }
  if (Object.prototype.hasOwnProperty.call(patch, "address")) {
    payload.address = patch.address;
  }
  if (Object.prototype.hasOwnProperty.call(patch, "city")) {
    payload.city = patch.city || "";
  }
  if (Object.prototype.hasOwnProperty.call(patch, "zip")) {
    payload.zip = patch.zip || "";
  }
  if (Object.prototype.hasOwnProperty.call(patch, "country")) {
    payload.country = patch.country || "";
  }
  if (Object.prototype.hasOwnProperty.call(patch, "isDefault")) {
    payload.isDefault = Boolean(patch.isDefault);
  }

  if (payload.isDefault === true) {
    const addressesSnapshot = await get(ref(database, `companies/${companyId}/addresses`));
    const addresses = addressesSnapshot.val() || {};
    const updates = {};

    Object.keys(addresses).forEach((id) => {
      updates[`companies/${companyId}/addresses/${id}/isDefault`] = id === officeId;
    });
    updates[`companies/${companyId}/addresses/${officeId}/updatedAt`] = payload.updatedAt;

    Object.entries(payload).forEach(([key, value]) => {
      if (key === "isDefault" || key === "updatedAt") return;
      updates[`companies/${companyId}/addresses/${officeId}/${key}`] = value;
    });

    await update(ref(database), updates);
    return;
  }

  await update(ref(database, `companies/${companyId}/addresses/${officeId}`), payload);
};

export const removeCompanyOffice = async (companyId, officeId) => {
  if (!companyId || !officeId) return;

  const addressesRef = ref(database, `companies/${companyId}/addresses`);
  const addressesSnapshot = await get(addressesRef);
  const addresses = addressesSnapshot.val() || {};
  const removedOffice = addresses[officeId];

  await remove(ref(database, `companies/${companyId}/addresses/${officeId}`));

  if (!removedOffice?.isDefault) return;

  const remainingSnapshot = await get(addressesRef);
  const remainingAddresses = remainingSnapshot.val() || {};
  const nextDefaultId = Object.keys(remainingAddresses)[0];

  if (!nextDefaultId) return;

  await update(ref(database, `companies/${companyId}/addresses/${nextDefaultId}`), {
    isDefault: true,
    updatedAt: new Date().toISOString(),
  });
};
