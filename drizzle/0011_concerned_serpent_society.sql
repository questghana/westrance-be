CREATE TABLE "Westrance_Employee" (
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
	CONSTRAINT "Westrance_Employee_employee_id_unique" UNIQUE("employee_id"),
	CONSTRAINT "Westrance_Employee_email_address_unique" UNIQUE("email_address")
);
--> statement-breakpoint
ALTER TABLE "Westrance_Employee" ADD CONSTRAINT "Westrance_Employee_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;