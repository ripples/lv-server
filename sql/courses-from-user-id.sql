SELECT
  c.id,
  c.name,
  c.description,
  c.start_dtm,
  c.end_dtm
FROM courses c
  INNER JOIN lkp_course_users lcu ON c.id = lcu.course_id
WHERE lcu.user_id = ?