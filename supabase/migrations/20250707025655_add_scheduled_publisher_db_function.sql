-- Create function to automatically publish scheduled posts
CREATE OR REPLACE FUNCTION publish_scheduled_posts()
RETURNS TABLE (
  published_count integer,
  published_post_ids integer[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  post_ids integer[];
  published_count integer := 0;
BEGIN
  -- Get IDs of posts that should be published
  SELECT array_agg(id) INTO post_ids
  FROM posts 
  WHERE status = 'scheduled' 
    AND published_at <= NOW()
    AND published_at IS NOT NULL;

  -- If no posts to publish, return early
  IF post_ids IS NULL OR array_length(post_ids, 1) IS NULL THEN
    RETURN QUERY SELECT 0::integer, ARRAY[]::integer[];
    RETURN;
  END IF;

  -- Update posts to published status
  UPDATE posts 
  SET 
    status = 'published',
    updated_at = NOW()
  WHERE id = ANY(post_ids)
    AND status = 'scheduled'; -- Double-check to prevent race conditions

  -- Get count of updated rows
  GET DIAGNOSTICS published_count = ROW_COUNT;

  -- Return results
  RETURN QUERY SELECT published_count, post_ids;
END;
$$;

-- Grant execute permission to the service role
GRANT EXECUTE ON FUNCTION publish_scheduled_posts() TO service_role;

-- Add comment for documentation
COMMENT ON FUNCTION publish_scheduled_posts() IS 'Automatically publishes scheduled posts that have reached their publish_at time';

-- Create a view to easily check scheduled posts
CREATE OR REPLACE VIEW scheduled_posts_ready AS
SELECT 
  id,
  title,
  status,
  published_at,
  created_at,
  EXTRACT(EPOCH FROM (published_at - NOW())) / 60 as minutes_until_publish
FROM posts 
WHERE status = 'scheduled' 
  AND published_at IS NOT NULL
ORDER BY published_at ASC;

-- Grant access to the view
GRANT SELECT ON scheduled_posts_ready TO service_role;
GRANT SELECT ON scheduled_posts_ready TO authenticated;

COMMENT ON VIEW scheduled_posts_ready IS 'View showing scheduled posts with time until publication';