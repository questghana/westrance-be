ALTER TABLE "Westrance_Employee" ALTER COLUMN "benefits" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "Addemployee" ALTER COLUMN "benefits" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "add_hospital_employee" ALTER COLUMN "benefits" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "Westrance_Employee" ADD COLUMN "in_patient_amount" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "Westrance_Employee" ADD COLUMN "out_patient_amount" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "Addemployee" ADD COLUMN "in_patient_amount" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "Addemployee" ADD COLUMN "out_patient_amount" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "add_invoice" ADD COLUMN "in_patient_invoice_amount" varchar(100);--> statement-breakpoint
ALTER TABLE "add_invoice" ADD COLUMN "out_patient_invoice_amount" varchar(100);--> statement-breakpoint
ALTER TABLE "add_invoice" ADD COLUMN "in_patient_remaining_balance" varchar(100);--> statement-breakpoint
ALTER TABLE "add_invoice" ADD COLUMN "out_patient_remaining_balance" varchar(100);--> statement-breakpoint
ALTER TABLE "add_invoice" ADD COLUMN "benefit_type_used" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "add_hospital_employee" ADD COLUMN "in_patient_amount" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "add_hospital_employee" ADD COLUMN "out_patient_amount" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "Westrance_Employee" DROP COLUMN "amount_package";--> statement-breakpoint
ALTER TABLE "Addemployee" DROP COLUMN "amount_package";--> statement-breakpoint
ALTER TABLE "add_invoice" DROP COLUMN "amount";--> statement-breakpoint
ALTER TABLE "add_invoice" DROP COLUMN "remaining_balance";--> statement-breakpoint
ALTER TABLE "add_hospital_employee" DROP COLUMN "amount_package";