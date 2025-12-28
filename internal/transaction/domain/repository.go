package domain

import (
	"context"

	"github.com/google/uuid"
)

type TransactionRepository interface {
	Create(ctx context.Context, tx *Transaction) error
	GetByID(ctx context.Context, id uuid.UUID) (*Transaction, error)
	GetByIdempotencyKey(ctx context.Context, key string) (*Transaction, error)
	ListByAccountID(ctx context.Context, accountID uuid.UUID, limit, offset int) ([]*Transaction, int64, error)
	UpdateStatus(ctx context.Context, id uuid.UUID, status TransactionStatus) error
}
