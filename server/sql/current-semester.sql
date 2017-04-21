SELECT
  id,
  UNIX_TIMESTAMP(start_dtm) * 1000 as startEpoch,
  UNIX_TIMESTAMP(end_dtm) * 1000 as endEpoch
FROM semesters
ORDER BY end_dtm DESC
LIMIT 1
