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

function isManagerRole(role) {
  return role === "owner" || role === "leader";
}

exports.deleteCompanyMember = onRequest(async (req, res) => {
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

    if (!isManagerRole(requesterRole)) {
      throw buildHttpError(403, "insufficient_role");
    }

    const memberId = normalizeText(req.body?.memberId);
    if (!memberId) {
      throw buildHttpError(400, "missing_member_id");
    }

    const requestCompanyId = normalizeText(req.body?.companyId);
    if (requestCompanyId && requestCompanyId !== identity.companyId) {
      throw buildHttpError(403, "company_mismatch");
    }

    const database = getAdminDatabase();

    const [employeeSnapshot, userSnapshot] = await Promise.all([
      database.ref(`companies/${identity.companyId}/employees/${memberId}`).get(),
      database.ref(`users/${memberId}`).get(),
    ]);

    if (!employeeSnapshot.exists() && !userSnapshot.exists()) {
      throw buildHttpError(404, "member_not_found");
    }

    const employeeData = employeeSnapshot.exists() ? employeeSnapshot.val() || {} : {};
    const userData = userSnapshot.exists() ? userSnapshot.val() || {} : {};
    const memberCompanyId = normalizeText(userData?.companyId);

    if (memberCompanyId && memberCompanyId !== identity.companyId) {
      throw buildHttpError(403, "member_outside_company");
    }

    const targetRole = normalizeRole(employeeData?.role || userData?.role);
    if (targetRole === "owner") {
      throw buildHttpError(403, "cannot_delete_owner");
    }

    const updates = {};
    updates[`companies/${identity.companyId}/employees/${memberId}`] = null;
    updates[`companies/${identity.companyId}/managerPermissions/${memberId}`] = null;
    updates[`users/${memberId}`] = null;
    await database.ref().update(updates);

    try {
      await getAdminAuth().deleteUser(memberId);
    } catch (error) {
      if (error?.code !== "auth/user-not-found") {
        logger.error("deleteCompanyMember auth deletion failed", {
          code: error?.code || "",
          message: error?.message || String(error),
          requesterUid: identity.uid,
          memberId,
          companyId: identity.companyId,
        });
        throw buildHttpError(500, "member_auth_deletion_failed");
      }
    }

    return res.status(200).json({
      success: true,
      memberId,
    });
  } catch (error) {
    logger.error("deleteCompanyMember failed", {
      code: error?.code || "",
      message: error?.message || String(error),
    });

    if (error?.status && error?.code) {
      return res.status(error.status).json({error: error.code});
    }

    return res.status(500).json({error: "delete_member_failed"});
  }
});
