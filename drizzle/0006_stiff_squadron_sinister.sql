ALTER TABLE "admins" ADD COLUMN "role" varchar(50);--> statement-breakpoint
ALTER TABLE "Companyregister" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;