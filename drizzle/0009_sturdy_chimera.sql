ALTER TABLE "CreateTicket" ADD COLUMN "ticket_status" "ticket_status" DEFAULT 'Pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "CreateTicket" DROP COLUMN "status";