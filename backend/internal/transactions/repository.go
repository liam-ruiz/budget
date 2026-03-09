package transactions

import (
	"context"

	"github.com/google/uuid"
	"github.com/liam-ruiz/budget/internal/db/sqlcdb"
	
)

// Repository defines the interface for transaction data access.
type Repository interface {
	Create(ctx context.Context, params sqlcdb.CreateTransactionParams) (sqlcdb.Transaction, error)
	Upsert(ctx context.Context, params sqlcdb.UpsertTransactionParams) (sqlcdb.Transaction, error)
	GetByAccountID(ctx context.Context, plaidAccountID string) ([]sqlcdb.Transaction, error)
	GetByUserID(ctx context.Context, appUserID uuid.UUID) ([]sqlcdb.GetTransactionsByUserIDRow, error)
	GetByBudgetID(ctx context.Context, budgetID uuid.UUID) ([]sqlcdb.GetTransactionsByBudgetIDRow, error)
	Delete(ctx context.Context, plaidTransactionID string) error
}

type repository struct {
	q *sqlcdb.Queries
}

// NewRepository creates a new transaction repository backed by sqlc queries.
func NewRepository(q *sqlcdb.Queries) Repository {
	return &repository{q: q}
}

func (r *repository) Create(ctx context.Context, params sqlcdb.CreateTransactionParams) (sqlcdb.Transaction, error) {
	return r.q.CreateTransaction(ctx, params)
}

func (r *repository) Upsert(ctx context.Context, params sqlcdb.UpsertTransactionParams) (sqlcdb.Transaction, error) {
	return r.q.UpsertTransaction(ctx, params)
}

func (r *repository) GetByAccountID(ctx context.Context, plaidAccountID string) ([]sqlcdb.Transaction, error) {
	return r.q.GetTransactionsByAccountID(ctx, plaidAccountID)
}

func (r *repository) GetByUserID(ctx context.Context, userID uuid.UUID) ([]sqlcdb.GetTransactionsByUserIDRow, error) {
	return r.q.GetTransactionsByUserID(ctx, userID)

}

func (r *repository) GetByBudgetID(ctx context.Context, budgetID uuid.UUID) ([]sqlcdb.GetTransactionsByBudgetIDRow, error) {
	return r.q.GetTransactionsByBudgetID(ctx, budgetID)
}

func (r *repository) Delete(ctx context.Context, plaidTransactionID string) error {
	return r.q.DeleteTransaction(ctx, plaidTransactionID)
}
