package domain

import (
	"context"

	"github.com/google/uuid"
)

type CustomerRepository interface {
	Create(ctx context.Context, customer *Customer) error
	GetByUserID(ctx context.Context, userID uuid.UUID) (*Customer, error)
	GetByID(ctx context.Context, id uuid.UUID) (*Customer, error)
	Update(ctx context.Context, customer *Customer) error
}
