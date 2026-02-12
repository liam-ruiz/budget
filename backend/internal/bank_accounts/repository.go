package bank_accounts

import (
	"context"

	"github.com/google/uuid"
	"github.com/liam-ruiz/budget/internal/db/sqlcdb"
)

// Repository defines the interface for bank account data access.
type Repository interface {
	Create(ctx context.Context, params sqlcdb.CreateLinkedAccountParams) (BankAccount, error)
	GetByUserID(ctx context.Context, userID uuid.UUID) ([]BankAccount, error)
	GetByID(ctx context.Context, id uuid.UUID) (BankAccount, error)
	GetByPlaidItemID(ctx context.Context, plaidItemID string) (BankAccount, error)
	UpdateBalance(ctx context.Context, params sqlcdb.UpdateAccountBalanceParams) error
}

type repository struct {
	q *sqlcdb.Queries
}

// NewRepository creates a new bank account repository backed by sqlc queries.
func NewRepository(q *sqlcdb.Queries) Repository {
	return &repository{q: q}
}

func (r *repository) Create(ctx context.Context, params sqlcdb.CreateLinkedAccountParams) (BankAccount, error) {
	row, err := r.q.CreateLinkedAccount(ctx, params)
	if err != nil {
		return BankAccount{}, err
	}
	return toBankAccount(row), nil
}

func (r *repository) GetByUserID(ctx context.Context, userID uuid.UUID) ([]BankAccount, error) {
	rows, err := r.q.GetLinkedAccountsByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	accounts := make([]BankAccount, len(rows))
	for i, row := range rows {
		accounts[i] = toBankAccount(row)
	}
	return accounts, nil
}

func (r *repository) GetByID(ctx context.Context, id uuid.UUID) (BankAccount, error) {
	row, err := r.q.GetLinkedAccountByID(ctx, id)
	if err != nil {
		return BankAccount{}, err
	}
	return toBankAccount(row), nil
}

func (r *repository) GetByPlaidItemID(ctx context.Context, plaidItemID string) (BankAccount, error) {
	row, err := r.q.GetLinkedAccountByPlaidItemID(ctx, plaidItemID)
	if err != nil {
		return BankAccount{}, err
	}
	return toBankAccount(row), nil
}

func (r *repository) UpdateBalance(ctx context.Context, params sqlcdb.UpdateAccountBalanceParams) error {
	return r.q.UpdateAccountBalance(ctx, params)
}

func toBankAccount(row sqlcdb.LinkedAccount) BankAccount {
	return BankAccount{
		ID:               row.ID,
		UserID:           row.UserID,
		PlaidItemID:      row.PlaidItemID,
		PlaidAccessToken: row.PlaidAccessToken,
		InstitutionName:  row.InstitutionName,
		AccountName:      row.AccountName,
		AccountType:      row.AccountType,
		CurrentBalance:   row.CurrentBalance,
		AvailableBalance: row.AvailableBalance,
		LastSyncedAt:     row.LastSyncedAt,
	}
}
