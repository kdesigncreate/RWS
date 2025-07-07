-- Add 'scheduled' status to posts table constraint
ALTER TABLE "public"."posts" 
DROP CONSTRAINT IF EXISTS "posts_status_check";

ALTER TABLE "public"."posts" 
ADD CONSTRAINT "posts_status_check" 
CHECK ((("status")::text = ANY ((ARRAY['draft'::character varying, 'published'::character varying, 'scheduled'::character varying, 'archived'::character varying])::text[])));

-- Add index for scheduled posts to improve performance when checking for posts to publish
CREATE INDEX IF NOT EXISTS "idx_posts_scheduled_published_at" 
ON "public"."posts" ("status", "published_at") 
WHERE "status" = 'scheduled';

-- Add comment for documentation
COMMENT ON COLUMN "public"."posts"."status" IS 'Status of the post: draft, published, scheduled, or archived';