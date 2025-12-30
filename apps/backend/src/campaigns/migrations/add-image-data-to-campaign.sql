-- Add imageData column to campaign table for storing base64 encoded images
ALTER TABLE campaign ADD COLUMN IF NOT EXISTS "imageData" text;

