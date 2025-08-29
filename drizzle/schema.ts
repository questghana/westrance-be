import { pgTable, unique, text, timestamp, boolean, varchar, integer, foreignKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const users = pgTable("users", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	image: text(),
	emailVerified: boolean("email_verified").notNull(),
	role: varchar({ length: 50 }).default('User'),
	password: text(),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const throttleInsight = pgTable("throttle_insight", {
	waitTime: integer("wait_time").notNull(),
	msBeforeNext: integer("ms_before_next").notNull(),
	endPoint: varchar("end_point", { length: 225 }),
	allottedPoints: integer("allotted_points").notNull(),
	consumedPoints: integer("consumed_points").notNull(),
	remainingPoints: integer("remaining_points").notNull(),
	key: varchar({ length: 225 }).primaryKey().notNull(),
	isFirstInDuration: boolean("is_first_in_duration").notNull(),
});

export const verification = pgTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
});

export const account = pgTable("account", {
	id: text().primaryKey().notNull(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: 'string' }),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { mode: 'string' }),
	scope: text(),
	password: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "account_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const companyregister = pgTable("Companyregister", {
	id: varchar().primaryKey().notNull(),
	industry: varchar({ length: 100 }),
	region: varchar({ length: 100 }).notNull(),
	city: varchar({ length: 100 }).notNull(),
	address: varchar({ length: 100 }).notNull(),
	website: varchar({ length: 100 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	companyName: varchar("company_name", { length: 100 }).notNull(),
	companyType: varchar("company_type", { length: 100 }).notNull(),
	registrationNumber: varchar("registration_number", { length: 100 }).notNull(),
	numberOfEmployees: integer("number_of_employees").notNull(),
	administrativeName: varchar("administrative_name", { length: 100 }).notNull(),
	administrativeEmail: varchar("administrative_email", { length: 100 }).notNull(),
	createPassword: varchar("create_password", { length: 100 }).notNull(),
	confirmPassword: varchar("confirm_password", { length: 100 }).notNull(),
	profileImage: varchar("profile_image", { length: 300 }),
	termsAccepted: boolean("terms_accepted").notNull(),
});

export const session = pgTable("session", {
	id: text().primaryKey().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	token: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "session_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("session_token_unique").on(table.token),
]);

export const addemployee = pgTable("Addemployee", {
	id: varchar().primaryKey().notNull(),
	employeeId: varchar("employee_id", { length: 20 }).notNull(),
	firstName: varchar("first_name", { length: 100 }).notNull(),
	middleName: varchar("middle_name", { length: 100 }),
	lastName: varchar("last_name", { length: 100 }).notNull(),
	emailAddress: varchar("email_address", { length: 100 }).notNull(),
	registrationNumber: varchar("registration_number").notNull(),
	startingDate: timestamp("starting_date", { mode: 'string' }).notNull(),
	duration: varchar({ length: 100 }).notNull(),
	amountPackage: varchar("amount_package", { length: 100 }).notNull(),
	benefits: varchar({ length: 100 }).notNull(),
	createPassword: varchar("create_password", { length: 100 }).notNull(),
	profileImage: varchar("profile_image", { length: 300 }),
	addDependents: varchar("add_dependents", { length: 3 }),
	employee: varchar({ length: 50 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	userId: varchar("user_id", { length: 128 }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "Addemployee_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("Addemployee_employee_id_unique").on(table.employeeId),
	unique("Addemployee_email_address_unique").on(table.emailAddress),
]);
