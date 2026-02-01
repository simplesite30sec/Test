-- 1. Create a function to delete expired unpaid sites
CREATE OR REPLACE FUNCTION delete_expired_sites()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM sites
  WHERE is_paid = false
  AND expires_at < NOW();
END;
$$;

-- 2. Enable pg_cron extension (if not enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 3. Schedule the function to run every hour
-- '0 * * * *' means minute 0 of every hour
SELECT cron.schedule('delete-expired-sites', '0 * * * *', $$SELECT delete_expired_sites()$$);

-- To check scheduled jobs:
-- SELECT * FROM cron.job;

-- To un-schedule:
-- SELECT cron.unschedule('delete-expired-sites');
