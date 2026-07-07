ALTER TABLE "JobPosting"
  ADD COLUMN "department" TEXT,
  ADD COLUMN "commitment" TEXT,
  ADD COLUMN "workplace"  TEXT,
  ADD COLUMN "salary"     TEXT,
  ADD COLUMN "tags"       TEXT[] NOT NULL DEFAULT '{}';
