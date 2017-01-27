SELECT
  id
FROM lkp_user_reset_token_id
WHERE user_email = ?
      AND valid = 1
      AND expire_dtm > now()
