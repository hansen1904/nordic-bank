package domain

import (
	"time"

	"github.com/google/uuid"
)

type TransactionType string

const (
	TypeTransfer   TransactionType = "transfer"
	TypeDeposit    TransactionType = "deposit"
	TypeWithdrawal TransactionType = "withdrawal"
	TypePayment    TransactionType = "payment"
)

type TransactionStatus string

const (
	StatusPending   TransactionStatus = "pending"
	StatusCompleted TransactionStatus = "completed"
	StatusFailed    TransactionStatus = "failed"
	StatusCancelled TransactionStatus = "cancelled"
)

type Transaction struct {
	ID                   uuid.UUID         `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	SourceAccountID      *uuid.UUID        `gorm:"type:uuid;index"`
	DestinationAccountID *uuid.UUID        `gorm:"type:uuid;index"`
	Amount               int64             `gorm:"not null"` // Smallest unit (e.g. øre)
	Currency             string            `gorm:"size:3;not null"`
	Type                 TransactionType   `gorm:"type:transaction.transaction_type;not null"`
	Status               TransactionStatus `gorm:"type:transaction.transaction_status;default:'pending'"`
	Reference            string            `gorm:"size:100"`
	Description          string            `gorm:"type:text"`
	IdempotencyKey       string            `gorm:"size:255;uniqueIndex"`

	CreatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP"`
	UpdatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP"`
}

func (Transaction) TableName() string {
	return "transaction.transactions"
}
