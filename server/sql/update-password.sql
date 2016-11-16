UPDATE users
SET password = ?, update_dtm=now()
WHERE email = ?
