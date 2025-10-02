CREATE TABLE "company_notifications" (
	"id" varchar PRIMARY KEY NOT NULL,
	"recipient_company_id" varchar(128) NOT NULL,
	"type" varchar(50) NOT NULL,
	"message" varchar(500) NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "company_notifications" ADD CONSTRAINT "company_notifications_recipient_company_id_Companyregister_company_id_fk" FOREIGN KEY ("recipient_company_id") REFERENCES "public"."Companyregister"("company_id") ON DELETE cascade ON UPDATE no action;