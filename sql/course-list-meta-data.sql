SELECT
  c.id          AS id,
  c.name        AS course_name,
  c.description AS course_description,
  s.id          AS semester,
  s.start_dtm   AS semester_start_dtm,
  s.end_dtm     AS semester_end_dtm,
  prof.fname    AS prof_fname,
  prof.lname    AS prof_lname,
  prof.email    AS prof_email
FROM courses c
  INNER JOIN semesters s ON s.id = c.semester_id
  INNER JOIN (SELECT
                u.fname,
                u.lname,
                u.email,
                lcu.course_id
              FROM lkp_course_users lcu
                INNER JOIN users u ON u.id = lcu.user_id
              WHERE u.user_type_id = 3 AND lcu.course_id IN (?)
             ) prof
    ON prof.course_id = c.id
WHERE c.id IN (?)
