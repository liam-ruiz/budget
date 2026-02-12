package budgets

import (
	"context"

	"github.com/google/uuid"
	"github.com/liam-ruiz/budget/internal/db/sqlcdb"
)

// Service handles budget business logic.
type Service struct {
	repo Repository
}

// NewService creates a new budget service.
func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

// CreateBudget creates a new budget for a user.
func (s *Service) CreateBudget(ctx context.Context, params sqlcdb.CreateBudgetParams) (BudgetResponse, error) {
	b, err := s.repo.Create(ctx, params)
	if err != nil {
		return BudgetResponse{}, err
	}
	return ToBudgetResponse(b), nil
}

// GetBudgets returns all budgets for a user.
func (s *Service) GetBudgets(ctx context.Context, userID uuid.UUID) ([]BudgetResponse, error) {
	budgets, err := s.repo.GetByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	out := make([]BudgetResponse, len(budgets))
	for i, b := range budgets {
		out[i] = ToBudgetResponse(b)
	}
	return out, nil
}
