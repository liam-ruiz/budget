-- name: UpsertTransaction :one
INSERT INTO
    transactions (
        plaid_transaction_id,
        plaid_account_id,
        transaction_date,
        transaction_name,
        amount,
        pending,
        merchant_name,
        logo_url,
        personal_finance_category,
        detailed_category,
        category_confidence_level,
        category_icon_url
    )
VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12
    )
ON CONFLICT (plaid_transaction_id) DO
UPDATE
SET
    transaction_date = EXCLUDED.transaction_date,
    transaction_name = EXCLUDED.transaction_name,
    amount = EXCLUDED.amount,
    pending = EXCLUDED.pending,
    merchant_name = EXCLUDED.merchant_name,
    logo_url = EXCLUDED.logo_url,
    personal_finance_category = EXCLUDED.personal_finance_category,
    detailed_category = EXCLUDED.detailed_category,
    category_confidence_level = EXCLUDED.category_confidence_level,
    category_icon_url = EXCLUDED.category_icon_url
RETURNING
    *;

-- name: CreateTransaction :one
INSERT INTO
    transactions (
        plaid_transaction_id,
        plaid_account_id,
        transaction_date,
        transaction_name,
        amount,
        pending,
        merchant_name,
        logo_url,
        personal_finance_category,
        detailed_category,
        category_confidence_level,
        category_icon_url
    )
VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12
    )
RETURNING
    *;

-- name: GetTransactionsByAccountID :many
SELECT
    plaid_transaction_id,
    plaid_account_id,
    transaction_date,
    transaction_name,
    amount,
    pending,
    merchant_name,
    logo_url,
    COALESCE(user_personal_finance_category, personal_finance_category) AS personal_finance_category,
    detailed_category,
    category_confidence_level,
    category_icon_url,
    created_at
FROM transactions
WHERE
    plaid_account_id = $1
ORDER BY transaction_date DESC;

-- name: GetTransactionsByUserID :many
SELECT
    t.plaid_transaction_id,
    t.plaid_account_id,
    t.transaction_date,
    t.transaction_name,
    t.amount,
    t.pending,
    t.merchant_name,
    t.logo_url,
    COALESCE(t.user_personal_finance_category, t.personal_finance_category) AS personal_finance_category,
    t.detailed_category,
    t.category_confidence_level,
    t.category_icon_url,
    t.created_at,
    ba.account_name
FROM
    transactions t
    JOIN bank_accounts ba ON t.plaid_account_id = ba.plaid_account_id
    JOIN plaid_items pli ON ba.plaid_item_id = pli.plaid_item_id
WHERE
    pli.app_user_id = $1
ORDER BY t.transaction_date DESC;

-- name: GetTransactionCategoryTotalsByUserID :many
SELECT
    COALESCE(NULLIF(UPPER(COALESCE(t.user_personal_finance_category, t.personal_finance_category)), ''), 'OTHER')::TEXT AS category,
    COALESCE(SUM(t.amount), 0)::NUMERIC(12, 2) AS total_amount,
    COUNT(*)::BIGINT AS transaction_count
FROM
    transactions t
    JOIN bank_accounts ba ON t.plaid_account_id = ba.plaid_account_id
    JOIN plaid_items pli ON ba.plaid_item_id = pli.plaid_item_id
WHERE
    pli.app_user_id = $1
    AND t.transaction_date >= sqlc.arg(start_date)
    AND t.transaction_date <= sqlc.arg(end_date)
    AND UPPER(COALESCE(t.user_personal_finance_category, t.personal_finance_category)) NOT LIKE '%TRANSFER%'
    AND UPPER(COALESCE(t.user_personal_finance_category, t.personal_finance_category)) NOT LIKE '%LOAN%'
    AND (
        (UPPER(ba.account_type) = 'DEPOSITORY' AND UPPER(COALESCE(ba.account_subtype, '')) = 'CHECKING')
        OR (UPPER(ba.account_type) = 'CREDIT' AND UPPER(COALESCE(ba.account_subtype, '')) = 'CREDIT CARD')
    )
GROUP BY
    1
ORDER BY
    total_amount DESC,
    category ASC;

-- name: CreateTransactions :copyfrom
INSERT INTO
    transactions (
        plaid_transaction_id,
        plaid_account_id,
        transaction_date,
        transaction_name,
        amount,
        pending,
        merchant_name,
        logo_url,
        personal_finance_category,
        detailed_category,
        category_confidence_level,
        category_icon_url
    )
VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12
    );

-- name: DeleteTransaction :exec
DELETE FROM transactions WHERE plaid_transaction_id = $1;

-- name: UpdateTransactionCategory :exec
UPDATE transactions
SET
    user_personal_finance_category = $2
WHERE
    plaid_transaction_id = $1;

-- name: GetTransactionsByBudgetID :many
SELECT
    t.plaid_transaction_id,
    t.plaid_account_id,
    t.transaction_date,
    t.transaction_name,
    t.amount,
    t.pending,
    t.merchant_name,
    t.logo_url,
    COALESCE(t.user_personal_finance_category, t.personal_finance_category) AS personal_finance_category,
    t.detailed_category,
    t.category_confidence_level,
    t.category_icon_url,
    t.created_at,
    ba.account_name
FROM
    budgets b
    JOIN plaid_items pl ON b.app_user_id = pl.app_user_id
    JOIN bank_accounts ba ON pl.plaid_item_id = ba.plaid_item_id
    JOIN transactions t ON ba.plaid_account_id = t.plaid_account_id
WHERE
    b.id = $1
    AND (
        b.category IS NULL
        OR UPPER(COALESCE(t.user_personal_finance_category, t.personal_finance_category)) = UPPER(b.category)
    )
    AND
    t.transaction_date >= b.start_date AND
    (b.end_date IS NULL OR t.transaction_date <= b.end_date)
ORDER BY t.transaction_date DESC;
