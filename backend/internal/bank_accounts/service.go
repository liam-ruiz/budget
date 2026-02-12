package bank_accounts

import (
	"context"

	"github.com/google/uuid"
	"github.com/liam-ruiz/budget/internal/db/sqlcdb"
)

// Service handles bank account business logic.
type Service struct {
	repo Repository
}

// NewService creates a new bank account service.
func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

// GetAccounts returns all linked accounts for a user.
func (s *Service) GetAccounts(ctx context.Context, userID uuid.UUID) ([]AccountResponse, error) {
	accounts, err := s.repo.GetByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	out := make([]AccountResponse, len(accounts))
	for i, a := range accounts {
		out[i] = ToAccountResponse(a)
	}
	return out, nil
}

// CreateAccount creates a new linked bank account.
func (s *Service) CreateAccount(ctx context.Context, params sqlcdb.CreateLinkedAccountParams) (BankAccount, error) {
	return s.repo.Create(ctx, params)
}
