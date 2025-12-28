package domain

import (
	"time"

	"github.com/google/uuid"
)

type AccountType string

const (
	AccountTypeChecking   AccountType = "checking"
	AccountTypeSavings    AccountType = "savings"
	AccountTypeInvestment AccountType = "investment"
	AccountTypeLoan       AccountType = "loan"
)

type AccountStatus string

const (
	AccountStatusActive  AccountStatus = "active"
	AccountStatusFrozen  AccountStatus = "frozen"
	AccountStatusClosed  AccountStatus = "closed"
	AccountStatusDormant AccountStatus = "dormant"
)

type Account struct {
	ID            uuid.UUID   `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	CustomerID    uuid.UUID   `gorm:"type:uuid;not null;index"`
	AccountNumber string      `gorm:"not null;uniqueIndex;size:34"`
	AccountName   string      `gorm:"size:255"`
	AccountType   AccountType `gorm:"type:account.account_type;not null"`
	Currency      string      `gorm:"size:3;default:'DKK'"`

	Balance          int64 `gorm:"not null;default:0"` // Minor units (e.g. øre)
	AvailableBalance int64 `gorm:"not null;default:0"`
	ReservedAmount   int64 `gorm:"not null;default:0"`

	Status AccountStatus `gorm:"type:account.account_status;default:'active'"`

	CreatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP"`
	UpdatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP"`
	OpenedAt  time.Time `gorm:"default:CURRENT_DATE"`
	ClosedAt  *time.Time
}

func (Account) TableName() string {
	return "account.accounts"
}

type LedgerEntryType string

const (
	EntryTypeDebit  LedgerEntryType = "debit"
	EntryTypeCredit LedgerEntryType = "credit"
)

type LedgerEntry struct {
	ID            uuid.UUID       `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	AccountID     uuid.UUID       `gorm:"type:uuid;not null;index"`
	TransactionID *uuid.UUID      `gorm:"type:uuid"`
	EntryType     LedgerEntryType `gorm:"not null"`
	Amount        int64           `gorm:"not null"`
	BalanceBefore int64           `gorm:"not null"`
	BalanceAfter  int64           `gorm:"not null"`
	Description   string          `gorm:"type:text"`
	Reference     string          `gorm:"size:100"`
	EntryDate     time.Time       `gorm:"default:CURRENT_TIMESTAMP"`
}

func (LedgerEntry) TableName() string {
	return "account.account_ledger"
}
