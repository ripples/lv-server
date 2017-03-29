SELECT
  u.fname,
  u.lname,
  u.id as user_id,
  c.id as course_id,
  c.name as course_name,
  lcu.user_type_id,
  ut.name as user_type_name
FROM users u
  INNER JOIN lkp_course_users lcu ON lcu.user_id = u.id
  INNER JOIN courses c ON c.id = lcu.course_id
  INNER JOIN user_type ut ON ut.id = lcu.user_type_id
WHERE c.id IN (?)
  AND c.semester_id = ?;
