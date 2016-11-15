SELECT
  id,
  UNIX_TIMESTAMP(start_dtm) as startEpoch,
  UNIX_TIMESTAMP(end_dtm) as endEpoch
FROM semesters
ORDER BY end_dtm DESC
LIMIT 1
