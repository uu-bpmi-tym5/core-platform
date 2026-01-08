-- Migration: Change avatarUrl column type from varchar to text
-- This allows storing base64 encoded images directly in the database

ALTER TABLE "profile"
ALTER COLUMN "avatarUrl" TYPE text;

