package transactions

import (
	"time"

	"github.com/google/uuid"
)

// Transaction represents a financial transaction from a linked account.
type Transaction struct {
	ID        uuid.UUID `json:"id"`
	AccountID uuid.UUID `json:"account_id"`
	Date      time.Time `json:"date"`
	Name      string    `json:"name"`
	Category  string    `json:"category"`
	Amount    string    `json:"amount"`
	Pending   bool      `json:"pending"`
	CreatedAt time.Time `json:"created_at"`
}
