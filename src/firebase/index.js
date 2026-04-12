/**
 * @module firebase/index
 * @description Barrel exports for Firebase app instances and service helpers.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */

export { auth, database } from "./auth/app";
export * from "./auth/auth.service";
export * from "./auth/member-auth.service";
export * from "./auth/company.service";
export * from "./team/departments.service";
export * from "./team/offices.service";
export * from "./team/members.service";
export * from "./management/management.service";
export * from "./workshops/workshop-sessions.service";
export * from "./workshops/paper-brain.service";
export * from "./workshops/workshop-voice.service";
