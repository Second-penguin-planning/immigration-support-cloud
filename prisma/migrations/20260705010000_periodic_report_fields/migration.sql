-- AlterTable
ALTER TABLE "periodic_reports" ADD COLUMN     "job_description" TEXT,
ADD COLUMN     "job_description_changed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "salary_amount" INTEGER,
ADD COLUMN     "salary_changed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "working_conditions_changed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "working_conditions_notes" TEXT;

