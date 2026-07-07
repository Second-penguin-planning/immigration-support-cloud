-- CreateEnum
CREATE TYPE "CoeApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'WITHDRAWN');

-- CreateTable
CREATE TABLE "coe_applications" (
    "id" TEXT NOT NULL,
    "foreign_national_id" TEXT NOT NULL,
    "status_type" TEXT NOT NULL,
    "status" "CoeApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "planned_submission_date" DATE,
    "submitted_at" DATE,
    "result_notified_at" DATE,
    "notes" TEXT,
    "converted_residence_status_id" TEXT,
    "created_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coe_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "coe_applications_converted_residence_status_id_key" ON "coe_applications"("converted_residence_status_id");

-- CreateIndex
CREATE INDEX "coe_applications_foreign_national_id_idx" ON "coe_applications"("foreign_national_id");

-- AddForeignKey
ALTER TABLE "coe_applications" ADD CONSTRAINT "coe_applications_foreign_national_id_fkey" FOREIGN KEY ("foreign_national_id") REFERENCES "foreign_nationals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coe_applications" ADD CONSTRAINT "coe_applications_converted_residence_status_id_fkey" FOREIGN KEY ("converted_residence_status_id") REFERENCES "residence_statuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coe_applications" ADD CONSTRAINT "coe_applications_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

