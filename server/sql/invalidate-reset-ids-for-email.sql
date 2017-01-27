UPDATE lkp_user_reset_token_id
SET valid = 0
WHERE user_email = ?
