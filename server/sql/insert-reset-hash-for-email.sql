INSERT INTO lkp_user_reset_token_hash (reset_key_hash, user_email, expire_dtm)
VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 2 HOUR))