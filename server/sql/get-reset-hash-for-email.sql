SELECT
  id, reset_key_hash as hash
FROM lkp_user_reset_token_hash
WHERE user_email = ?
      AND valid = 1
      AND expire_dtm > now()
