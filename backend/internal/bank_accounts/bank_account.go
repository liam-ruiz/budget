package bank_accounts

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
)

// BankAccount represents a Plaid-linked bank account.
type BankAccount struct {
	ID               uuid.UUID    `json:"id"`
	UserID           uuid.UUID    `json:"user_id"`
	PlaidItemID      string       `json:"-"`
	PlaidAccessToken string       `json:"-"`
	InstitutionName  string       `json:"institution_name"`
	AccountName      string       `json:"account_name"`
	AccountType      string       `json:"account_type"`
	CurrentBalance   string       `json:"current_balance"`
	AvailableBalance string       `json:"available_balance"`
	LastSyncedAt     sql.NullTime `json:"last_synced_at"`
}

// AccountResponse is the JSON-safe view sent to clients.
type AccountResponse struct {
	ID               uuid.UUID  `json:"id"`
	InstitutionName  string     `json:"institution_name"`
	AccountName      string     `json:"account_name"`
	AccountType      string     `json:"account_type"`
	CurrentBalance   string     `json:"current_balance"`
	AvailableBalance string     `json:"available_balance"`
	LastSyncedAt     *time.Time `json:"last_synced_at"`
}

func ToAccountResponse(a BankAccount) AccountResponse {
	var synced *time.Time
	if a.LastSyncedAt.Valid {
		synced = &a.LastSyncedAt.Time
	}
	return AccountResponse{
		ID:               a.ID,
		InstitutionName:  a.InstitutionName,
		AccountName:      a.AccountName,
		AccountType:      a.AccountType,
		CurrentBalance:   a.CurrentBalance,
		AvailableBalance: a.AvailableBalance,
		LastSyncedAt:     synced,
	}
}
