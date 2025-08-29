import { relations } from "drizzle-orm/relations";
import { users, account, session, addemployee } from "./schema";

export const accountRelations = relations(account, ({one}) => ({
	user: one(users, {
		fields: [account.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	accounts: many(account),
	sessions: many(session),
	addemployees: many(addemployee),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(users, {
		fields: [session.userId],
		references: [users.id]
	}),
}));

export const addemployeeRelations = relations(addemployee, ({one}) => ({
	user: one(users, {
		fields: [addemployee.userId],
		references: [users.id]
	}),
}));