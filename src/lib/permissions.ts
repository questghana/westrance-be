import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

export const statement = {
  ...defaultStatements,
  project: ["create", "share", "update", "delete"],
} as const;

export const ac = createAccessControl(statement);

export const westranceAdmin = ac.newRole({
  project: ["create", "share", "update", "delete"],
  ...adminAc.statements,
});

export const companySide = ac.newRole({
  project: ["create", "share", "update", "delete"],
});

export const companySideEmployeeSide = ac.newRole({
  project: ["create", "share"],
});

export const hospitalAndPharmacySide = ac.newRole({
  project: ["create", "share", "update", "delete"],
});
