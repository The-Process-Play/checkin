-- CreateEnum
CREATE TYPE "RecurrenceCadence" AS ENUM ('WEEKLY', 'BIWEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "FeedbackRequestStatus" AS ENUM ('PENDING', 'COMPLETED');

-- AlterTable
ALTER TABLE "CheckIn" ADD COLUMN     "lowScoreNote" TEXT;

-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "supportNeeded" TEXT;

-- AlterTable
ALTER TABLE "OneOnOne" ADD COLUMN     "seriesId" TEXT;

-- CreateTable
CREATE TABLE "OneOnOneSeries" (
    "id" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "cadence" "RecurrenceCadence" NOT NULL,
    "agendaTemplate" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OneOnOneSeries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shoutout" (
    "id" TEXT NOT NULL,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Shoutout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackRequest" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "status" "FeedbackRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedbackRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackResponse" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "strengths" TEXT NOT NULL,
    "areasToImprove" TEXT NOT NULL,
    "additionalComments" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedbackResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OneOnOneSeries_managerId_idx" ON "OneOnOneSeries"("managerId");

-- CreateIndex
CREATE INDEX "OneOnOneSeries_reportId_idx" ON "OneOnOneSeries"("reportId");

-- CreateIndex
CREATE INDEX "Shoutout_fromId_idx" ON "Shoutout"("fromId");

-- CreateIndex
CREATE INDEX "Shoutout_toId_idx" ON "Shoutout"("toId");

-- CreateIndex
CREATE INDEX "Shoutout_toId_createdAt_idx" ON "Shoutout"("toId", "createdAt");

-- CreateIndex
CREATE INDEX "FeedbackRequest_subjectId_idx" ON "FeedbackRequest"("subjectId");

-- CreateIndex
CREATE INDEX "FeedbackRequest_reviewerId_idx" ON "FeedbackRequest"("reviewerId");

-- CreateIndex
CREATE UNIQUE INDEX "FeedbackResponse_requestId_key" ON "FeedbackResponse"("requestId");

-- CreateIndex
CREATE INDEX "OneOnOne_seriesId_idx" ON "OneOnOne"("seriesId");

-- AddForeignKey
ALTER TABLE "OneOnOneSeries" ADD CONSTRAINT "OneOnOneSeries_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OneOnOneSeries" ADD CONSTRAINT "OneOnOneSeries_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OneOnOne" ADD CONSTRAINT "OneOnOne_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "OneOnOneSeries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shoutout" ADD CONSTRAINT "Shoutout_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shoutout" ADD CONSTRAINT "Shoutout_toId_fkey" FOREIGN KEY ("toId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackRequest" ADD CONSTRAINT "FeedbackRequest_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackRequest" ADD CONSTRAINT "FeedbackRequest_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackResponse" ADD CONSTRAINT "FeedbackResponse_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "FeedbackRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

