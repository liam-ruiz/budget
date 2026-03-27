-- name: CreateBudget :one
INSERT INTO
    budgets (
        app_user_id,
        name,
        category,
        limit_amount,
        budget_period,
        start_date,
        end_date
    )
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING
    *;

-- name: GetBudgetsByUserID :many
SELECT * FROM budgets WHERE app_user_id = $1 ORDER BY name;

-- name: GetBudgetByID :one
SELECT * FROM budgets WHERE id = $1;

-- name: DeleteBudget :exec
DELETE FROM budgets WHERE id = $1;

-- name: UpdateBudget :one
UPDATE budgets
SET
    name = COALESCE(NULLIF($2, ''), name),
    category = CASE
        WHEN $3::BOOLEAN THEN $4
        ELSE category
    END,
    limit_amount = CASE
        WHEN $5::NUMERIC(12, 2) IS NOT NULL THEN $5
        ELSE limit_amount
    END,
    budget_period = COALESCE(NULLIF($6, ''), budget_period),
    start_date = CASE
        WHEN $7::DATE IS NOT NULL THEN $7
        ELSE start_date
    END,
    end_date = CASE
        WHEN $8::BOOLEAN THEN $9
        ELSE end_date
    END
WHERE
    id = $1
RETURNING
    *;

-- name: UpdateBudgetAmountSpent :one
UPDATE budgets SET amount_spent = $2 WHERE id = $1 RETURNING *;

-- name: CalculateBudgetSpendByCategory :one
SELECT COALESCE(SUM(t.amount), 0)::NUMERIC(12, 2) AS total_spent
FROM
    transactions t
    JOIN bank_accounts ba ON t.plaid_account_id = ba.plaid_account_id
    JOIN plaid_items pi ON ba.plaid_item_id = pi.plaid_item_id
WHERE
    pi.app_user_id = $1
    AND UPPER(COALESCE(t.user_personal_finance_category, t.personal_finance_category)) = UPPER($2)
    AND t.transaction_date >= $3
    AND (
        t.transaction_date <= $4
        OR $4 IS NULL
    );

-- name: CalculateBudgetSpendAll :one
SELECT COALESCE(SUM(t.amount), 0)::NUMERIC(12, 2) AS total_spent
FROM
    transactions t
    JOIN bank_accounts ba ON t.plaid_account_id = ba.plaid_account_id
    JOIN plaid_items pi ON ba.plaid_item_id = pi.plaid_item_id
WHERE
    pi.app_user_id = $1
    AND t.transaction_date >= $2
    AND (
        t.transaction_date <= $3
        OR $3 IS NULL
    );
