CREATE TABLE "Addemployee" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar(128) NOT NULL,
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
	"employee" varchar(50),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	CONSTRAINT "Addemployee_employee_id_unique" UNIQUE("employee_id"),
	CONSTRAINT "Addemployee_email_address_unique" UNIQUE("email_address")
);
--> statement-breakpoint
CREATE TABLE "Companyregister" (
	"id" varchar PRIMARY KEY NOT NULL,
	"company_name" varchar(100) NOT NULL,
	"company_type" varchar(100) NOT NULL,
	"industry" varchar(100),
	"registration_number" varchar(100) NOT NULL,
	"number_of_employees" integer NOT NULL,
	"region" varchar(100) NOT NULL,
	"city" varchar(100) NOT NULL,
	"address" varchar(100) NOT NULL,
	"website" varchar(100),
	"administrative_name" varchar(100) NOT NULL,
	"administrative_email" varchar(100) NOT NULL,
	"create_password" varchar(100) NOT NULL,
	"confirm_password" varchar(100) NOT NULL,
	"profile_image" varchar(300),
	"terms_accepted" boolean NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "session" RENAME COLUMN "userId" TO "updated_at";--> statement-breakpoint
ALTER TABLE "session" RENAME COLUMN "expiresAt" TO "ip_address";--> statement-breakpoint
ALTER TABLE "session" RENAME COLUMN "createdAt" TO "user_agent";--> statement-breakpoint
ALTER TABLE "session" RENAME COLUMN "updatedAt" TO "user_id";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "full_name" TO "name";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "profile_pic" TO "image";--> statement-breakpoint
ALTER TABLE "verification" RENAME COLUMN "expiresAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "verification" RENAME COLUMN "createdAt" TO "updated_at";--> statement-breakpoint
ALTER TABLE "session" DROP CONSTRAINT "session_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "account_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "provider_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "access_token" text;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "refresh_token" text;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "id_token" text;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "access_token_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "refresh_token_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "created_at" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "updated_at" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "expires_at" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "created_at" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" varchar(50) DEFAULT 'User';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password" text;--> statement-breakpoint
ALTER TABLE "verification" ADD COLUMN "expires_at" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "Addemployee" ADD CONSTRAINT "Addemployee_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" DROP COLUMN "accountId";--> statement-breakpoint
ALTER TABLE "account" DROP COLUMN "providerId";--> statement-breakpoint
ALTER TABLE "account" DROP COLUMN "accessToken";--> statement-breakpoint
ALTER TABLE "account" DROP COLUMN "refreshToken";--> statement-breakpoint
ALTER TABLE "account" DROP COLUMN "idToken";--> statement-breakpoint
ALTER TABLE "account" DROP COLUMN "accessTokenExpiresAt";--> statement-breakpoint
ALTER TABLE "account" DROP COLUMN "refreshTokenExpiresAt";--> statement-breakpoint
ALTER TABLE "account" DROP COLUMN "createdAt";--> statement-breakpoint
ALTER TABLE "account" DROP COLUMN "updatedAt";--> statement-breakpoint
ALTER TABLE "session" DROP COLUMN "ipAddress";--> statement-breakpoint
ALTER TABLE "session" DROP COLUMN "userAgent";--> statement-breakpoint
ALTER TABLE "verification" DROP COLUMN "updatedAt";