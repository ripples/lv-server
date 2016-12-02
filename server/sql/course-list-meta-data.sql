SELECT
  c.id          AS id,
  c.name        AS course_name,
  c.description AS course_description,
  s.id          AS semester,
  s.start_dtm   AS semester_start_dtm,
  s.end_dtm     AS semester_end_dtm
FROM courses c
  INNER JOIN semesters s ON s.id = c.semester_id
WHERE c.id IN (?)