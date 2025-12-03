CREATE TABLE IF NOT EXISTS "profile" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" uuid NOT NULL UNIQUE,
  "slug" varchar(50) NOT NULL UNIQUE,
  "displayName" varchar(80) NOT NULL,
  "bio" text NULL,
  "avatarUrl" varchar(2048) NULL,
  "location" varchar(120) NULL,
  "website" varchar(2048) NULL,
  "socialLinks" jsonb NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "fk_profile_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "creator_profile" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "profileId" uuid NOT NULL UNIQUE,
  "isPublic" boolean NOT NULL DEFAULT false,
  "creatorBio" text NULL,
  "primaryCategory" varchar(120) NULL,
  "highlights" text NULL,
  "privateMetadata" jsonb NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "fk_creator_profile_profile" FOREIGN KEY ("profileId") REFERENCES "profile"("id") ON DELETE CASCADE
);

