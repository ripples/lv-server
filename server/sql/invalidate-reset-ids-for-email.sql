UPDATE lkp_user_reset_token_ids
SET valid = 0
WHERE user_email = ?
