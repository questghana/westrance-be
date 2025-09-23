CREATE TABLE "notifications" (
	"id" varchar PRIMARY KEY NOT NULL,
	"recipient_id" varchar(128) NOT NULL,
	"type" varchar(50) NOT NULL,
	"message" varchar(500) NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_admins_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;