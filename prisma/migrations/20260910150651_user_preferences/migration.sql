-- AlterTable
ALTER TABLE "User" ADD COLUMN     "notifyCheckInReminders" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyWeeklyDigest" BOOLEAN NOT NULL DEFAULT true;

