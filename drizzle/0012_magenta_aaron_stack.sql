CREATE TABLE "westrance_roles_management" (
	"id" varchar PRIMARY KEY NOT NULL,
	"employee_id" varchar(20) NOT NULL,
	"employee_name" varchar(100) NOT NULL,
	"role_name" varchar(100) NOT NULL,
	"role_description" varchar(100) NOT NULL,
	"password" varchar(100) NOT NULL,
	"confirm_password" varchar(100) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "westrance_roles_management" ADD CONSTRAINT "westrance_roles_management_employee_id_Westrance_Employee_employee_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."Westrance_Employee"("employee_id") ON DELETE cascade ON UPDATE no action;