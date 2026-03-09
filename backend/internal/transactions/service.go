package transactions

import (
	"context"
	"errors"
	"fmt"
	"log"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/liam-ruiz/budget/internal/db/sqlcdb"
	"github.com/liam-ruiz/budget/internal/util"
	plaidlib "github.com/plaid/plaid-go/v20/plaid"
)

var ErrTransactionNotFound = errors.New("transaction not found")
var ErrAccountNotFound = errors.New("account not found")
var ErrBudgetNotFound = errors.New("budget not found")

// Service handles transaction business logic.
type Service struct {
	repo Repository
}

// NewService creates a new transaction service.
func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

// GetByUser returns all transactions across all linked accounts for a user.
func (s *Service) GetByUser(ctx context.Context, userID uuid.UUID) ([]TransactionWithAccountName, error) {
	DBTransactions, err := s.repo.GetByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	return toTransactionsWithAccountName(DBTransactions), nil
}

// GetByAccount returns all transactions for a single account.
func (s *Service) GetByAccount(ctx context.Context, accountID string) ([]Transaction, error) {
	DBTransactions, err := s.repo.GetByAccountID(ctx, accountID)
	if err != nil {
		return nil, err
	}

	return toTransactions(DBTransactions), nil
}

// GetByBudget returns all user transactions applicable to the given budget.
func (s *Service) GetByBudgetID(ctx context.Context, userID, budgetID uuid.UUID) ([]TransactionWithAccountName, error) {
	DBTransactions, err := s.repo.GetByBudgetID(ctx, budgetID)
	if err != nil {
		return nil, err
	}
	return toTransactionsWithAccountNameByBudgetID(DBTransactions), nil
}

// DeleteTransaction deletes a transaction with the given Plaid transaction ID if it belongs to the user.
func (s *Service) DeleteTransaction(ctx context.Context, userID uuid.UUID, plaidTransactionID string) error {
	transactions, err := s.repo.GetByUserID(ctx, userID)
	if err != nil {
		return err
	}

	// TODO: optimize this by adding a GetTransactionByPlaidTransactionID query and verifying the transaction belongs to the user in SQL instead of in application code
	for _, transaction := range transactions {
		if transaction.PlaidTransactionID == plaidTransactionID {
			return s.repo.Delete(ctx, plaidTransactionID)
		}
	}

	return ErrTransactionNotFound
}

// CreateTransaction persists a single transaction.
func (s *Service) CreateTransaction(ctx context.Context, params sqlcdb.CreateTransactionParams) (Transaction, error) {
	dbTxn, err := s.repo.Create(ctx, params)
	if err != nil {
		return Transaction{}, err
	}
	return toTransaction(dbTxn), nil
}

// CreateTransactions upserts transactions from a Plaid sync update.
// Both Added and Modified transactions are upserted into the database.
func (s *Service) CreateTransactions(ctx context.Context, update TransactionUpdate) error {
	allTransactions := make([]plaidlib.Transaction, 0, len(update.Added)+len(update.Modified))
	allTransactions = append(allTransactions, update.Added...)
	allTransactions = append(allTransactions, update.Modified...)

	if len(allTransactions) == 0 {
		log.Printf("[CreateTransactions] no transactions to upsert for item %s", update.PlaidItemID)
		return nil
	}

	var upsertErrors int
	// TODO: optimize this by doing batch upserts in the repository instead of upserting transactions one by one in application code
	for _, t := range allTransactions {
		datetime := t.Datetime
		var date time.Time
		if datetime.IsSet() {
			date = *datetime.Get()
		} else { // take the date from the transaction obj and fill time with current time
			currTime := time.Now()
			strDate := strings.Split(t.Date, "-")
			year, _ := strconv.Atoi(strDate[0])
			month, _ := strconv.Atoi(strDate[1])
			day, _ := strconv.Atoi(strDate[2])
			date = time.Date(year, time.Month(month), day, 0, 0, 0, 0, currTime.Location())
		}

		params := sqlcdb.UpsertTransactionParams{
			PlaidTransactionID: t.TransactionId,
			PlaidAccountID:     t.AccountId,
			TransactionDate:    pgtype.Date{Valid: true, Time: date},
			TransactionName:    t.Name,
			Amount:             util.Float64ToNumeric(t.GetAmount()),
			Pending:            t.Pending,
			MerchantName:       pgtype.Text{String: t.GetMerchantName(), Valid: t.MerchantName.IsSet()},
			LogoUrl:            pgtype.Text{String: t.GetLogoUrl(), Valid: t.LogoUrl.IsSet()},
			CategoryIconUrl:    pgtype.Text{String: t.GetPersonalFinanceCategoryIconUrl(), Valid: t.PersonalFinanceCategoryIconUrl != nil},
		}

		// Extract personal finance category fields if available
		if pfc, ok := t.GetPersonalFinanceCategoryOk(); ok && pfc != nil {
			params.PersonalFinanceCategory = pgtype.Text{String: pfc.GetPrimary(), Valid: true}
			params.DetailedCategory = pgtype.Text{String: pfc.GetDetailed(), Valid: true}
			params.CategoryConfidenceLevel = pgtype.Text{String: string(pfc.GetConfidenceLevel()), Valid: true}
		}

		_, err := s.repo.Upsert(ctx, params)
		if err != nil {
			log.Printf("[CreateTransactions] failed to upsert transaction %s: %v", t.TransactionId, err)
			upsertErrors++
		}
	}

	if upsertErrors > 0 {
		return fmt.Errorf("failed to upsert %d/%d transactions", upsertErrors, len(allTransactions))
	}

	log.Printf("[CreateTransactions] successfully upserted %d transactions for item %s", len(allTransactions), update.PlaidItemID)
	return nil
}

func toTransactionWithAccountName(row sqlcdb.GetTransactionsByUserIDRow) TransactionWithAccountName {
	return TransactionWithAccountName{
		PlaidTransactionID:      row.PlaidTransactionID,
		AccountID:               row.PlaidAccountID,
		Date:                    row.TransactionDate.Time.Format("2006-01-02"),
		Name:                    row.TransactionName,
		Amount:                  util.NumericToString(row.Amount),
		Pending:                 row.Pending,
		MerchantName:            row.MerchantName.String,
		LogoUrl:                 row.LogoUrl.String,
		PersonalFinanceCategory: row.PersonalFinanceCategory.String,
		DetailedCategory:        row.DetailedCategory.String,
		CategoryConfidenceLevel: row.CategoryConfidenceLevel.String,
		CategoryIconUrl:         row.CategoryIconUrl.String,
		CreatedAt:               row.CreatedAt.Time,
		AccountName:             row.AccountName,
	}
}

func toTransactionWithAccountNameByBudgetID(row sqlcdb.GetTransactionsByBudgetIDRow) TransactionWithAccountName {
	return TransactionWithAccountName{
		PlaidTransactionID:      row.PlaidTransactionID,
		AccountID:               row.PlaidAccountID,
		Date:                    row.TransactionDate.Time.Format("2006-01-02"),
		Name:                    row.TransactionName,
		Amount:                  util.NumericToString(row.Amount),
		Pending:                 row.Pending,
		MerchantName:            row.MerchantName.String,
		LogoUrl:                 row.LogoUrl.String,
		PersonalFinanceCategory: row.PersonalFinanceCategory.String,
		DetailedCategory:        row.DetailedCategory.String,
		CategoryConfidenceLevel: row.CategoryConfidenceLevel.String,
		CategoryIconUrl:         row.CategoryIconUrl.String,
		CreatedAt:               row.CreatedAt.Time,
		AccountName:             row.AccountName,
	}
}

func toTransactionsWithAccountName(rows []sqlcdb.GetTransactionsByUserIDRow) []TransactionWithAccountName {
	out := make([]TransactionWithAccountName, len(rows))
	for i, row := range rows {
		out[i] = toTransactionWithAccountName(row)
	}
	return out
}

func toTransactionsWithAccountNameByBudgetID(rows []sqlcdb.GetTransactionsByBudgetIDRow) []TransactionWithAccountName {
	out := make([]TransactionWithAccountName, len(rows))
	for i, row := range rows {
		out[i] = toTransactionWithAccountNameByBudgetID(row)
	}
	return out
}

func toTransaction(row sqlcdb.Transaction) Transaction {
	return Transaction{
		PlaidTransactionID:      row.PlaidTransactionID,
		AccountID:               row.PlaidAccountID,
		Date:                    row.TransactionDate.Time.Format("2006-01-02"),
		Name:                    row.TransactionName,
		Amount:                  util.NumericToString(row.Amount),
		Pending:                 row.Pending,
		MerchantName:            row.MerchantName.String,
		LogoUrl:                 row.LogoUrl.String,
		PersonalFinanceCategory: row.PersonalFinanceCategory.String,
		DetailedCategory:        row.DetailedCategory.String,
		CategoryConfidenceLevel: row.CategoryConfidenceLevel.String,
		CategoryIconUrl:         row.CategoryIconUrl.String,
		CreatedAt:               row.CreatedAt.Time,
	}
}

func toTransactions(rows []sqlcdb.Transaction) []Transaction {
	out := make([]Transaction, len(rows))
	for i, row := range rows {
		out[i] = toTransaction(row)
	}
	return out
}

