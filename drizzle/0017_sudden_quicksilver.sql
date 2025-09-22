ALTER TABLE "AddDependents" ADD COLUMN "dependent_id" varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE "AddHospitalDependents" ADD COLUMN "dependent_id" varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE "AddDependents" ADD CONSTRAINT "AddDependents_dependent_id_unique" UNIQUE("dependent_id");--> statement-breakpoint
ALTER TABLE "AddHospitalDependents" ADD CONSTRAINT "AddHospitalDependents_dependent_id_unique" UNIQUE("dependent_id");