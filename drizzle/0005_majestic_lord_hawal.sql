CREATE TABLE "admins" (
	"id" varchar PRIMARY KEY NOT NULL,
	"admin_email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	CONSTRAINT "admins_admin_email_unique" UNIQUE("admin_email")
);
