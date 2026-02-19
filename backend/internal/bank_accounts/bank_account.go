package bank_accounts

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
)

// BankAccount represents a bank account linked via Plaid.
type BankAccount struct {
	ID               uuid.UUID      `json:"id"`
	ItemID           uuid.UUID      `json:"item_id"`
	PlaidAccountID   string         `json:"-"`
	AccountName      string         `json:"account_name"`
	OfficialName     sql.NullString `json:"official_name"`
	AccountType      string         `json:"account_type"`
	AccountSubtype   sql.NullString `json:"account_subtype"`
	CurrentBalance   string         `json:"current_balance"`
	AvailableBalance string         `json:"available_balance"`
	IsoCurrencyCode  string         `json:"iso_currency_code"`
	UpdatedAt        time.Time      `json:"updated_at"`
}

// AccountResponse is the JSON-safe view sent to clients.
type AccountResponse struct {
	ID               uuid.UUID `json:"id"`
	InstitutionName  string    `json:"institution_name,omitempty"`
	AccountName      string    `json:"account_name"`
	AccountType      string    `json:"account_type"`
	AccountSubtype   string    `json:"account_subtype,omitempty"`
	CurrentBalance   string    `json:"current_balance"`
	AvailableBalance string    `json:"available_balance"`
	IsoCurrencyCode  string    `json:"iso_currency_code"`
}

func ToAccountResponse(a BankAccount) AccountResponse {
	subtype := ""
	if a.AccountSubtype.Valid {
		subtype = a.AccountSubtype.String
	}
	return AccountResponse{
		ID:               a.ID,
		AccountName:      a.AccountName,
		AccountType:      a.AccountType,
		AccountSubtype:   subtype,
		CurrentBalance:   a.CurrentBalance,
		AvailableBalance: a.AvailableBalance,
		IsoCurrencyCode:  a.IsoCurrencyCode,
	}
}
