-- name: UpsertTransaction :one
INSERT INTO
    transactions (
        account_id,
        date,
        name,
        category,
        amount,
        pending
    )
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (id) DO
UPDATE
SET
    date = EXCLUDED.date,
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    amount = EXCLUDED.amount,
    pending = EXCLUDED.pending
RETURNING
    *;

-- name: CreateTransaction :one
INSERT INTO
    transactions (
        account_id,
        date,
        name,
        category,
        amount,
        pending
    )
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING
    *;

-- name: GetTransactionsByAccountID :many
SELECT * FROM transactions WHERE account_id = $1 ORDER BY date DESC;

-- name: GetTransactionsByUserID :many
SELECT t.*
FROM
    transactions t
    JOIN linked_accounts la ON t.account_id = la.id
WHERE
    la.user_id = $1
ORDER BY t.date DESC;