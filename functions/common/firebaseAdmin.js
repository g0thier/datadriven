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

function getAdminMessaging() {
  return admin.messaging();
}

module.exports = {
  getAdminAuth,
  getAdminDatabase,
  getAdminMessaging,
};
