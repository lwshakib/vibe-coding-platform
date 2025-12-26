/*
  Warnings:

  - The values [REACT_TS,NEXT_TS] on the enum `AppType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AppType_new" AS ENUM ('VITE_APP', 'NEXT_APP');
ALTER TABLE "Workspace" ALTER COLUMN "app_type" TYPE "AppType_new" USING ("app_type"::text::"AppType_new");
ALTER TYPE "AppType" RENAME TO "AppType_old";
ALTER TYPE "AppType_new" RENAME TO "AppType";
DROP TYPE "public"."AppType_old";
COMMIT;
