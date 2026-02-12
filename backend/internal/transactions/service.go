package transactions

import (
	"context"

	"github.com/google/uuid"
	"github.com/liam-ruiz/budget/internal/db/sqlcdb"
)

// Service handles transaction business logic.
type Service struct {
	repo Repository
}

// NewService creates a new transaction service.
func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

// GetByUser returns all transactions across all linked accounts for a user.
func (s *Service) GetByUser(ctx context.Context, userID uuid.UUID) ([]Transaction, error) {
	return s.repo.GetByUserID(ctx, userID)
}

// CreateTransaction persists a single transaction.
func (s *Service) CreateTransaction(ctx context.Context, params sqlcdb.CreateTransactionParams) (Transaction, error) {
	return s.repo.Create(ctx, params)
}
