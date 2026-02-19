-- name: UpsertTransaction :one
INSERT INTO
    transactions (
        account_id,
        transaction_date,
        transaction_name,
        category,
        amount,
        pending
    )
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (id) DO
UPDATE
SET
    transaction_date = EXCLUDED.transaction_date,
    transaction_name = EXCLUDED.transaction_name,
    category = EXCLUDED.category,
    amount = EXCLUDED.amount,
    pending = EXCLUDED.pending
RETURNING
    *;

-- name: CreateTransaction :one
INSERT INTO
    transactions (
        account_id,
        transaction_date,
        transaction_name,
        category,
        amount,
        pending
    )
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING
    *;

-- name: GetTransactionsByAccountID :many
SELECT *
FROM transactions
WHERE
    account_id = $1
ORDER BY transaction_date DESC;

-- name: GetTransactionsByUserID :many
SELECT t.*
FROM
    transactions t
    JOIN bank_accounts ba ON t.account_id = ba.id
    JOIN plaid_items pi ON ba.item_id = pi.id
WHERE
    pi.user_id = $1
ORDER BY t.transaction_date DESC;