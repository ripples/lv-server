UPDATE lkp_user_reset_token_hash
SET valid = 0
WHERE user_email = ?
