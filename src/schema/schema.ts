import { createId } from "@paralleldrive/cuid2";
import {
  text,
  pgTable,
  integer,
  varchar,
  boolean,
  timestamp,
  // ReferenceConfig,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";
import { createInsertSchema } from "drizzle-zod";
// import { createId } from "@paralleldrive/cuid2";

const timeStamps = {
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdateFn(() => new Date()),
};

type UUIDOptions = Exclude<Parameters<typeof varchar>[1], undefined>;

const uuid = (columnName?: string, options?: UUIDOptions) =>
  varchar(columnName ?? "id", options).$defaultFn(() => createId());

// const foreignkeyRef = (
//   columnName: string,
//   refColumn: ReferenceConfig["ref"],
//   actions?: ReferenceConfig["actions"]
// ) => varchar(columnName, { length: 128 }).references(refColumn, actions);

export const users = pgTable("users", {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').$defaultFn(() => false).notNull(),
  image: text('image'),
  createdAt: timestamp('created_at').$defaultFn(() => /* @__PURE__ */ new Date()).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(() => /* @__PURE__ */ new Date()).notNull(),
  role: text('role')
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});

export const throttleinsight = pgTable("throttle_insight", {
  waitTime: integer("wait_time").notNull(),
  msBeforeNext: integer("ms_before_next").notNull(),
  endPoint: varchar("end_point", { length: 225 }),
  pointsAllotted: integer("allotted_points").notNull(),
  consumedPoints: integer("consumed_points").notNull(),
  remainingPoints: integer("remaining_points").notNull(),
  key: varchar("key", { length: 225 }).primaryKey().notNull(),
  isFirstInDuration: boolean("is_first_in_duration").notNull(),
});

export const companyregister = pgTable("Companyregister", {
  id: uuid().primaryKey(),
  companyId: varchar("company_id", { length: 128 }).notNull().unique(),
  companyName: varchar("company_name", { length: 100 }).notNull(),
  companyType: varchar("company_type", { length: 100 }).notNull(),
  industry: varchar("industry", { length: 100 }),
  registrationNumber: varchar("registration_number", { length: 100 }).notNull(),
  numberOfEmployees: integer("number_of_employees").notNull(),
  phoneNumber: varchar("phone_number", { length: 100 }).notNull(),
  region: varchar("region", { length: 100 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  address: varchar("address", { length: 100 }).notNull(),
  website: varchar("website", { length: 100 }),
  administrativeName: varchar("administrative_name", { length: 100 }).notNull(),
  administrativeEmail: varchar("administrative_email", {
    length: 100,
  }).notNull(),
  createPassword: varchar("create_password", { length: 100 }).notNull(),
  confirmPassword: varchar("confirm_password", { length: 100 }).notNull(),
  profileImage: varchar("profile_image", { length: 300 }),
  termsAccepted: boolean("terms_accepted").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  ...timeStamps,
});

export const addEmployee = pgTable("Addemployee", {
  id: uuid().primaryKey(),
  userId: varchar("user_id", { length: 128 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  companyUserId: varchar("company_user_id", { length: 128 }).notNull(),
  employeeId: varchar("employee_id", { length: 20 }).notNull().unique(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  middleName: varchar("middle_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  emailAddress: varchar("email_address", { length: 100 }).notNull().unique(),
  registrationNumber: varchar("registration_number").notNull(),
  startingDate: timestamp("starting_date").notNull(),
  duration: varchar("duration", { length: 100 }).notNull(),
  inPatientAmount: varchar("in_patient_amount", { length: 100 }).notNull(),
  outPatientAmount: varchar("out_patient_amount", { length: 100 }).notNull(),
  benefits: text("benefits").array(),
  createPassword: varchar("create_password", { length: 100 }).notNull(),
  profileImage: varchar("profile_image", { length: 300 }),
  dependents: varchar("add_dependents", { length: 3 }),
  role: varchar("role", { length: 50 }),
  isActive: boolean("is_active").default(true).notNull(),
  ...timeStamps,
});

export const addDependents = pgTable("AddDependents", {
  id: uuid().primaryKey(),
  employeeId: uuid("employee_id").notNull().references(() => addEmployee.employeeId, { onDelete: "cascade" }),
  dependentId: varchar("dependent_id", { length: 20 }).notNull().unique(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  middleName: varchar("middle_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  emailAddress: varchar("email_address", { length: 100 }),
  relation: varchar("relation", { length: 100 }).notNull(),
  PhoneNumber: varchar("phone_number"),
  profileImage: varchar("profile_image", { length: 300 }),
  ...timeStamps,
});

export const createTicket = pgTable("CreateTicket", {
  id: uuid().primaryKey(),
  companyId: varchar("company_id", { length: 128 }).notNull().references(() => companyregister.companyId, { onDelete: "cascade" }),
  administrativeName: varchar("administrative_name", { length: 100 }).notNull(),
  administrativeEmail: varchar("administrative_email", { length: 100 }),
  subject: varchar("subject", { length: 100 }).notNull(),
  issue: varchar("issue", { length: 100 }).notNull(),
  status: varchar("status", { enum: ["Pending", "Approved"], }).$defaultFn(() => "Pending"),
  ...timeStamps,
})

export const addHospitalEmployee = pgTable("add_hospital_employee", {
  id: uuid().primaryKey(),
  userId: varchar("user_id", { length: 128 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  companyUserId: varchar("company_user_id", { length: 128 }).notNull(),
  employeeId: varchar("employee_id", { length: 20 }).notNull().unique(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  middleName: varchar("middle_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  emailAddress: varchar("email_address", { length: 100 }).notNull().unique(),
  registrationNumber: varchar("registration_number").notNull(),
  startingDate: timestamp("starting_date").notNull(),
  duration: varchar("duration", { length: 100 }).notNull(),
  inPatientAmount: varchar("in_patient_amount", { length: 100 }).notNull(),
  outPatientAmount: varchar("out_patient_amount", { length: 100 }).notNull(),
  benefits: text("benefits").array(),
  createPassword: varchar("create_password", { length: 100 }).notNull(),
  profileImage: varchar("profile_image", { length: 300 }),
  dependents: varchar("add_dependents", { length: 3 }),
  role: varchar("role", { length: 50 }),
  isActive: boolean("is_active").default(true).notNull(),
  ...timeStamps,
})

export const addHospitalDependents = pgTable("AddHospitalDependents", {
  id: uuid().primaryKey(),
  employeeId: uuid("employee_id").notNull().references(() => addHospitalEmployee.employeeId, { onDelete: "cascade" }),
  dependentId: varchar("dependent_id", { length: 20 }).notNull().unique(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  middleName: varchar("middle_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  emailAddress: varchar("email_address", { length: 100 }),
  relation: varchar("relation", { length: 100 }).notNull(),
  PhoneNumber: varchar("phone_number"),
  profileImage: varchar("profile_image", { length: 300 }),
  ...timeStamps,
});

export const HospitalRolesManagement = pgTable("hospital_roles_management", {
  id: uuid().primaryKey(),
  employeeId: varchar("employee_id", { length: 20 }).notNull().references(() => addHospitalEmployee.employeeId, { onDelete: "cascade" }),
  EmployeeName: varchar("employee_name", { length: 100 }).notNull(),
  RoleName: varchar("role_name", { length: 100 }).notNull(),
  RoleDescription: varchar("role_description", { length: 100 }).notNull(),
  Password: varchar("password", { length: 100 }).notNull(),
  ConfirmPassword: varchar("confirm_password", { length: 100 }).notNull(),
})

export const addEmployeeInvoice = pgTable("add_invoice", {
  id: uuid().primaryKey(),
  EmployeeId: varchar("employee_id", { length: 14 }).notNull(),
  employerCompanyId: varchar("employer_company_id", { length: 128 }).notNull().references(() => companyregister.companyId, { onDelete: "cascade" }),
  companyId: varchar("company_id", { length: 128 }).notNull().references(() => companyregister.companyId, { onDelete: "cascade" }),
  HospitalName: varchar("hospital_name", { length: 100 }).notNull(),
  PatientName: varchar("patient_name", { length: 100 }).notNull(),
  inPatientInvoiceAmount: varchar("in_patient_invoice_amount", { length: 100 }),
  outPatientInvoiceAmount: varchar("out_patient_invoice_amount", { length: 100 }),
  inPatientRemainingBalance: varchar("in_patient_remaining_balance", { length: 100 }),
  outPatientRemainingBalance: varchar("out_patient_remaining_balance", { length: 100 }),
  BenefitUsed: varchar("benefit", { length: 100 }).notNull(),
  benefitTypeUsed: varchar("benefit_type_used", { length: 50 }).notNull(),
  SubmittedDate: timestamp("submit_date", { withTimezone: false }).notNull(),
})

// ======= admin ========= // 

export const admins = pgTable("admins", {
  id: uuid().primaryKey(),
  email: varchar("admin_email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }),
  profileImage: varchar("profile_image", { length: 300 }),
})

export const notifications = pgTable("notifications", {
  id: uuid().primaryKey(),
  recipientId: varchar("recipient_id", { length: 128 }).notNull().references(() => admins.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(), // e.g., "new_ticket", "new_employee"
  message: varchar("message", { length: 500 }).notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  ...timeStamps,
});

export const companyNotifications = pgTable("company_notifications", {
  id: uuid().primaryKey(),
  recipientCompanyId: varchar("recipient_company_id", { length: 128 })
    .notNull()
    .references(() => companyregister.companyId, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(), // e.g., "ticket_status", "ticket_removed"
  message: varchar("message", { length: 500 }).notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  ...timeStamps,
});

export const WestranceEmployee = pgTable("Westrance_Employee", {
  id: uuid().primaryKey(),
  userId: varchar("user_id", { length: 128 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  companyUserId: varchar("company_user_id", { length: 128 }).notNull(),
  employeeId: varchar("employee_id", { length: 20 }).notNull().unique(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  middleName: varchar("middle_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  emailAddress: varchar("email_address", { length: 100 }).notNull().unique(),
  registrationNumber: varchar("registration_number").notNull(),
  startingDate: timestamp("starting_date").notNull(),
  duration: varchar("duration", { length: 100 }).notNull(),
  inPatientAmount: varchar("in_patient_amount", { length: 100 }).notNull(),
  outPatientAmount: varchar("out_patient_amount", { length: 100 }).notNull(),
  benefits: text("benefits").array(),
  createPassword: varchar("create_password", { length: 100 }).notNull(),
  profileImage: varchar("profile_image", { length: 300 }),
  dependents: varchar("add_dependents", { length: 3 }),
  role: varchar("role", { length: 50 }),
  isActive: boolean("is_active").default(true).notNull(),
  ...timeStamps,
});

export const WestranceRolesManagement = pgTable("westrance_roles_management", {
  id: uuid().primaryKey(),
  employeeId: varchar("employee_id", { length: 20 }).notNull().references(() => WestranceEmployee.employeeId, { onDelete: "cascade" }),
  EmployeeName: varchar("employee_name", { length: 100 }).notNull(),
  RoleName: varchar("role_name", { length: 100 }).notNull(),
  RoleDescription: varchar("role_description", { length: 100 }).notNull(),
  Password: varchar("password", { length: 100 }).notNull(),
  ConfirmPassword: varchar("confirm_password", { length: 100 }).notNull(),
})

export const addWestranceDependents = pgTable("Add_Westrance_Dependents", {
  id: uuid().primaryKey(),
  employeeId: uuid("employee_id").notNull().references(() => WestranceEmployee.employeeId, { onDelete: "cascade" }),
  dependentId: varchar("dependent_id", { length: 20 }).notNull().unique(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  middleName: varchar("middle_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  emailAddress: varchar("email_address", { length: 100 }),
  relation: varchar("relation", { length: 100 }).notNull(),
  PhoneNumber: varchar("phone_number"),
  profileImage: varchar("profile_image", { length: 300 }),
  ...timeStamps,
});




export const addEmployeeRelations = relations(addEmployee, ({ one }) => ({
  user: one(users, {
    fields: [addEmployee.userId],
    references: [users.id],
  }),
}));

export const userInsertSchema = createInsertSchema(users);
