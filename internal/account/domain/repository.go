package domain

import (
	"context"

	"github.com/google/uuid"
)

type AccountRepository interface {
	Create(ctx context.Context, account *Account) error
	GetByID(ctx context.Context, id uuid.UUID) (*Account, error)
	GetByAccountNumber(ctx context.Context, number string) (*Account, error)
	ListByCustomerID(ctx context.Context, customerID uuid.UUID) ([]*Account, error)
	Update(ctx context.Context, account *Account) error

	// Ledger
	CreateLedgerEntry(ctx context.Context, entry *LedgerEntry) error
}
