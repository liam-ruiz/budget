package transactions

import (
	"context"

	"github.com/google/uuid"
	"github.com/liam-ruiz/budget/internal/db/sqlcdb"
)

// Repository defines the interface for transaction data access.
type Repository interface {
	Create(ctx context.Context, params sqlcdb.CreateTransactionParams) (Transaction, error)
	GetByAccountID(ctx context.Context, accountID uuid.UUID) ([]Transaction, error)
	GetByUserID(ctx context.Context, userID uuid.UUID) ([]Transaction, error)
}

type repository struct {
	q *sqlcdb.Queries
}

// NewRepository creates a new transaction repository backed by sqlc queries.
func NewRepository(q *sqlcdb.Queries) Repository {
	return &repository{q: q}
}

func (r *repository) Create(ctx context.Context, params sqlcdb.CreateTransactionParams) (Transaction, error) {
	row, err := r.q.CreateTransaction(ctx, params)
	if err != nil {
		return Transaction{}, err
	}
	return toTransaction(row), nil
}

func (r *repository) GetByAccountID(ctx context.Context, accountID uuid.UUID) ([]Transaction, error) {
	rows, err := r.q.GetTransactionsByAccountID(ctx, accountID)
	if err != nil {
		return nil, err
	}
	return toTransactions(rows), nil
}

func (r *repository) GetByUserID(ctx context.Context, userID uuid.UUID) ([]Transaction, error) {
	rows, err := r.q.GetTransactionsByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	return toTransactions(rows), nil
}

func toTransaction(row sqlcdb.Transaction) Transaction {
	return Transaction{
		ID:        row.ID,
		AccountID: row.AccountID,
		Date:      row.TransactionDate,
		Name:      row.TransactionName,
		Category:  row.Category,
		Amount:    row.Amount,
		Pending:   row.Pending,
		CreatedAt: row.CreatedAt,
	}
}

func toTransactions(rows []sqlcdb.Transaction) []Transaction {
	out := make([]Transaction, len(rows))
	for i, row := range rows {
		out[i] = toTransaction(row)
	}
	return out
}
