-- name: CreateLinkedAccount :one
INSERT INTO
    linked_accounts (
        user_id,
        plaid_item_id,
        plaid_access_token,
        institution_name,
        account_name,
        account_type,
        current_balance,
        available_balance
    )
VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8
    )
RETURNING
    *;

-- name: GetLinkedAccountsByUserID :many
SELECT *
FROM linked_accounts
WHERE
    user_id = $1
ORDER BY institution_name, account_name;

-- name: GetLinkedAccountByID :one
SELECT * FROM linked_accounts WHERE id = $1;

-- name: UpdateAccountBalance :exec
UPDATE linked_accounts
SET
    current_balance = $2,
    available_balance = $3,
    last_synced_at = now()
WHERE
    id = $1;

-- name: GetLinkedAccountByPlaidItemID :one
SELECT * FROM linked_accounts WHERE plaid_item_id = $1 LIMIT 1;