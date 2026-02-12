-- name: CreateBudget :one
INSERT INTO
    budgets (
        user_id,
        category,
        limit_amount,
        period,
        start_date,
        end_date
    )
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING
    *;

-- name: GetBudgetsByUserID :many
SELECT * FROM budgets WHERE user_id = $1 ORDER BY category;

-- name: GetBudgetByID :one
SELECT * FROM budgets WHERE id = $1;

-- name: DeleteBudget :exec
DELETE FROM budgets WHERE id = $1;