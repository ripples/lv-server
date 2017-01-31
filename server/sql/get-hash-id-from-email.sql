SELECT
  id
FROM lkp_user_reset_token_ids
WHERE user_email = ?
      AND valid = 1
