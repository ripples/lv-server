SELECT
  c.id,
  c.name,
  c.description
FROM courses c
  INNER JOIN lkp_course_users lcu ON c.id = lcu.course_id
WHERE lcu.user_id = ?
