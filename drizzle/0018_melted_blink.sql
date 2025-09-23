ALTER TABLE "add_invoice"
ALTER COLUMN "submit_date" TYPE timestamp
USING "submit_date"::timestamp;
