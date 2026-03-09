import { get, push, ref, update } from "firebase/database";
import DEFAULT_DEPARTMENTS from "../constants/defaults";
import slugify from "../utils/string";
import { database } from "./app";

export const createCompany = async (uid, payload) => {
  if (!uid) {
    throw new Error("createCompany: uid manquant");
  }

  const now = new Date().toISOString();

  const companyRef = push(ref(database, "companies"));
  const companyId = companyRef.key;

  if (!companyId) {
    throw new Error("Impossible de générer companyId");
  }

  const slug = `${slugify(payload.company.name)}-${companyId.slice(-6)}`;

  const addressesInput = Array.isArray(payload.company.addresses)
    ? payload.company.addresses
    : [];

  const addresses = {};
  addressesInput.forEach((item) => {
    const addressRef = push(ref(database, `companies/${companyId}/addresses`));
    const addressId = addressRef.key;

    if (!addressId) return;

    addresses[addressId] = {
      alias: item.alias || "",
      address: item.address || "",
      city: item.city || "",
      zip: item.zip || "",
      country: item.country || "",
      isDefault: Boolean(item.isDefault),
      createdAt: now,
    };
  });

  const addressIds = Object.keys(addresses);
  if (addressIds.length > 0 && !addressIds.some((id) => addresses[id].isDefault)) {
    addresses[addressIds[0]].isDefault = true;
  }

  const departmentsInput =
    Array.isArray(payload.company.departments) && payload.company.departments.length > 0
      ? payload.company.departments
      : DEFAULT_DEPARTMENTS;

  const departments = {};
  departmentsInput.forEach((name) => {
    const departmentRef = push(ref(database, `companies/${companyId}/departments`));
    const departmentId = departmentRef.key;

    if (!departmentId) return;

    departments[departmentId] = {
      name,
      isActive: true,
      createdAt: now,
    };
  });

  const updates = {};

  updates[`users/${uid}`] = {
    email: payload.admin.email,
    firstName: payload.admin.firstName,
    lastName: payload.admin.lastName,
    phone: payload.admin.phone || "",
    companyId,
    role: "owner",
    isActive: true,
    createdAt: now,
  };

  updates[`companies/${companyId}`] = {
    name: payload.company.name,
    slug,
    legalForm: payload.company.legalForm || "",
    siret: payload.company.siret || "",
    vatNumber: payload.company.vatNumber || "",
    ownerUid: uid,
    plan: "free",
    status: "active",
    acceptTerms: payload.acceptTerms,
    createdAt: now,
    addresses,
    departments,
    employees: {
      [uid]: {
        role: "owner",
        isActive: true,
        joinedAt: now,
      },
    },
  };

  await update(ref(database), updates);

  return { companyId, slug };
};

export const getUserCompanyId = async (uid) => {
  if (!uid) return null;
  const snapshot = await get(ref(database, `users/${uid}/companyId`));
  return snapshot.exists() ? snapshot.val() : null;
};
