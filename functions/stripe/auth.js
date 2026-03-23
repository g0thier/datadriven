const { getAdminAuth, getAdminDatabase } = require("./firebaseAdmin");

function buildHttpError(status, code) {
  const error = new Error(code);
  error.status = Number(status) || 500;
  error.code = code;
  return error;
}

function readBearerToken(req) {
  const authorizationHeader = String(req.headers?.authorization || "").trim();
  if (!authorizationHeader) return "";

  const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return "";

  return String(match[1] || "").trim();
}

async function verifyRequestIdentity(req) {
  const idToken = readBearerToken(req);
  if (!idToken) {
    throw buildHttpError(401, "missing_auth_token");
  }

  let decodedToken = null;
  try {
    decodedToken = await getAdminAuth().verifyIdToken(idToken);
  } catch {
    throw buildHttpError(401, "invalid_auth_token");
  }

  const uid = String(decodedToken?.uid || "").trim();
  if (!uid) {
    throw buildHttpError(401, "invalid_auth_token");
  }

  const userSnapshot = await getAdminDatabase().ref(`users/${uid}`).get();
  const userData = userSnapshot.exists() ? userSnapshot.val() || {} : {};
  const companyId = String(userData?.companyId || "").trim();

  if (!companyId) {
    throw buildHttpError(403, "missing_company");
  }

  return {
    uid,
    companyId,
    userData,
  };
}

module.exports = {
  buildHttpError,
  verifyRequestIdentity,
};
