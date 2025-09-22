CREATE TABLE "Add_Westrance_Dependents" (
	"id" varchar PRIMARY KEY NOT NULL,
	"employee_id" varchar NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"middle_name" varchar(100),
	"last_name" varchar(100) NOT NULL,
	"email_address" varchar(100),
	"relation" varchar(100) NOT NULL,
	"phone_number" varchar,
	"profile_image" varchar(300),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "Add_Westrance_Dependents" ADD CONSTRAINT "Add_Westrance_Dependents_employee_id_Westrance_Employee_employee_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."Westrance_Employee"("employee_id") ON DELETE cascade ON UPDATE no action;