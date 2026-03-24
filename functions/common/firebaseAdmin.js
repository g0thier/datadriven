const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

function getAdminAuth() {
  return admin.auth();
}

function getAdminDatabase() {
  return admin.database();
}

module.exports = {
  getAdminAuth,
  getAdminDatabase,
};
