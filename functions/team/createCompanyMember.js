const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

const {verifyRequestIdentity, buildHttpError} = require("../common/auth");
const {getAdminAuth, getAdminDatabase} = require("../common/firebaseAdmin");

function setCorsHeaders(res) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeRole(value) {
  return normalizeText(value).toLowerCase();
}

function splitFullName(name = "") {
  const value = normalizeText(name);
  if (!value) {
    return {firstName: "", lastName: ""};
  }

  const parts = value.split(/\s+/).filter(Boolean);
  const firstName = parts.shift() || "";
  const lastName = parts.join(" ");
  return {firstName, lastName};
}

function toStringArray(value) {
  if (!Array.isArray(value)) return [];

  return Array.from(
      new Set(
          value
              .map((item) => normalizeText(item))
              .filter(Boolean)
      )
  );
}

function generatePassword(length = 16) {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const numbers = "23456789";
  const symbols = "!@#$%*_";

  const mandatory = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ];

  const allChars = `${upper}${lower}${numbers}${symbols}`;
  const remaining = Math.max(length - mandatory.length, 0);

  for (let index = 0; index < remaining; index += 1) {
    mandatory.push(allChars[Math.floor(Math.random() * allChars.length)]);
  }

  return mandatory
      .sort(() => Math.random() - 0.5)
      .join("");
}

function mapCreateMemberAuthError(errorCode) {
  const normalizedCode = normalizeText(errorCode);

  if (normalizedCode === "auth/email-already-exists") {
    return {
      status: 409,
      code: "auth/email-already-in-use",
    };
  }

  if (normalizedCode.startsWith("auth/")) {
    return {
      status: 400,
      code: normalizedCode,
    };
  }

  return null;
}

exports.createCompanyMember = onRequest(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  if (req.method !== "POST") {
    return res.status(405).json({error: "method_not_allowed"});
  }

  try {
    const identity = await verifyRequestIdentity(req);
    const requesterRole = normalizeRole(identity?.userData?.role);

    if (requesterRole !== "owner" && requesterRole !== "leader") {
      throw buildHttpError(403, "insufficient_role");
    }

    const requestCompanyId = normalizeText(req.body?.companyId);
    if (requestCompanyId && requestCompanyId !== identity.companyId) {
      throw buildHttpError(403, "company_mismatch");
    }

    const payload =
      req.body?.payload && typeof req.body.payload === "object" ? req.body.payload : {};

    const email = normalizeText(payload.email).toLowerCase();
    if (!email) {
      throw buildHttpError(400, "missing_email");
    }

    const nameFallback = splitFullName(payload.name || "");
    const firstName = normalizeText(payload.firstName) || nameFallback.firstName;
    const lastName = normalizeText(payload.lastName) || nameFallback.lastName;
    const officeId = normalizeText(payload.office) || null;
    const departments = toStringArray(payload.departments);
    const isActive = typeof payload.isActive === "boolean" ? payload.isActive : true;
    const requestedRole = normalizeRole(payload.role || "colab");

    if (requestedRole === "owner") {
      throw buildHttpError(403, "cannot_create_owner");
    }

    let role = "colab";
    if (requestedRole === "leader") {
      if (requesterRole !== "owner") {
        throw buildHttpError(403, "insufficient_role");
      }
      role = "leader";
    }

    const generatedPassword = generatePassword();
    const createdUser = await getAdminAuth().createUser({
      email,
      password: generatedPassword,
    });
    const memberId = normalizeText(createdUser?.uid);

    if (!memberId) {
      throw buildHttpError(500, "missing_member_uid");
    }

    const now = new Date().toISOString();
    const updates = {};
    updates[`users/${memberId}`] = {
      firstName,
      lastName,
      email,
      phone: normalizeText(payload.phone),
      companyId: identity.companyId,
      role,
      officeId,
      departmentIds: departments,
      isActive,
      createdAt: now,
      updatedAt: now,
    };

    updates[`companies/${identity.companyId}/employees/${memberId}`] = {
      role,
      officeId,
      departmentIds: departments,
      isActive,
      joinedAt: now,
      updatedAt: now,
    };

    try {
      await getAdminDatabase().ref().update(updates);
    } catch (error) {
      await getAdminAuth().deleteUser(memberId).catch(() => {});
      throw error;
    }

    return res.status(200).json({
      id: memberId,
      generatedPassword,
    });
  } catch (error) {
    logger.error("createCompanyMember failed", {
      code: error?.code || "",
      message: error?.message || String(error),
    });

    if (error?.status && error?.code) {
      return res.status(error.status).json({error: error.code});
    }

    const mappedAuthError = mapCreateMemberAuthError(error?.code);
    if (mappedAuthError) {
      return res.status(mappedAuthError.status).json({error: mappedAuthError.code});
    }

    return res.status(500).json({error: "create_member_failed"});
  }
});
