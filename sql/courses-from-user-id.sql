SELECT
  c.id,
  c.name
FROM courses c
  INNER JOIN lkp_course_users lcu ON c.id = lcu.course_id
  INNER JOIN semesters s ON s.id = c.semester_id
WHERE lcu.user_id = ?
      AND s.id = ?
