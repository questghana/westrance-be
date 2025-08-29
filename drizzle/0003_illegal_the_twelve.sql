CREATE TABLE "hospital_roles_management" (
	"id" varchar PRIMARY KEY NOT NULL,
	"employee_id" varchar(20) NOT NULL,
	"employee_name" varchar(100) NOT NULL,
	"role_name" varchar(100) NOT NULL,
	"role_description" varchar(100) NOT NULL,
	"password" varchar(100) NOT NULL,
	"confirm_password" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "AddDependents" (
	"id" varchar PRIMARY KEY NOT NULL,
	"employee_id" varchar NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"middle_name" varchar(100),
	"last_name" varchar(100) NOT NULL,
	"email_address" varchar(100),
	"relation" varchar(100) NOT NULL,
	"registration_number" varchar,
	"profile_image" varchar(300),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "add_invoice" (
	"id" varchar PRIMARY KEY NOT NULL,
	"employee_id" varchar(14) NOT NULL,
	"company_id" varchar(128) NOT NULL,
	"hospital_name" varchar(100) NOT NULL,
	"patient_name" varchar(100) NOT NULL,
	"amount" varchar(100) NOT NULL,
	"remaining_balance" varchar(100) NOT NULL,
	"benefit" varchar(100) NOT NULL,
	"submit_date" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "AddHospitalDependents" (
	"id" varchar PRIMARY KEY NOT NULL,
	"employee_id" varchar NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"middle_name" varchar(100),
	"last_name" varchar(100) NOT NULL,
	"email_address" varchar(100),
	"relation" varchar(100) NOT NULL,
	"registration_number" varchar,
	"profile_image" varchar(300),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "add_hospital_employee" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"company_user_id" varchar(128) NOT NULL,
	"employee_id" varchar(20) NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"middle_name" varchar(100),
	"last_name" varchar(100) NOT NULL,
	"email_address" varchar(100) NOT NULL,
	"registration_number" varchar NOT NULL,
	"starting_date" timestamp NOT NULL,
	"duration" varchar(100) NOT NULL,
	"amount_package" varchar(100) NOT NULL,
	"benefits" varchar(100) NOT NULL,
	"create_password" varchar(100) NOT NULL,
	"profile_image" varchar(300),
	"add_dependents" varchar(3),
	"role" varchar(50),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	CONSTRAINT "add_hospital_employee_employee_id_unique" UNIQUE("employee_id"),
	CONSTRAINT "add_hospital_employee_email_address_unique" UNIQUE("email_address")
);
--> statement-breakpoint
CREATE TABLE "CreateTicket" (
	"id" varchar PRIMARY KEY NOT NULL,
	"administrative_name" varchar(100) NOT NULL,
	"administrative_email" varchar(100),
	"subject" varchar(100) NOT NULL,
	"issue" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "Addemployee" ADD COLUMN "company_user_id" varchar(128) NOT NULL;--> statement-breakpoint
ALTER TABLE "Addemployee" ADD COLUMN "role" varchar(50);--> statement-breakpoint
ALTER TABLE "Addemployee" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "Companyregister" ADD COLUMN "company_id" varchar(128) NOT NULL;--> statement-breakpoint
ALTER TABLE "hospital_roles_management" ADD CONSTRAINT "hospital_roles_management_employee_id_add_hospital_employee_employee_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."add_hospital_employee"("employee_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "AddDependents" ADD CONSTRAINT "AddDependents_employee_id_Addemployee_employee_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."Addemployee"("employee_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "add_invoice" ADD CONSTRAINT "add_invoice_company_id_Companyregister_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."Companyregister"("company_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "AddHospitalDependents" ADD CONSTRAINT "AddHospitalDependents_employee_id_add_hospital_employee_employee_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."add_hospital_employee"("employee_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "add_hospital_employee" ADD CONSTRAINT "add_hospital_employee_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Addemployee" DROP COLUMN "employee";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "password";--> statement-breakpoint
ALTER TABLE "Companyregister" ADD CONSTRAINT "Companyregister_company_id_unique" UNIQUE("company_id");