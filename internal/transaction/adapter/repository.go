package adapter

import (
	"context"

	"nordic-bank/internal/transaction/domain"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PostgresTransactionRepository struct {
	db *gorm.DB
}

func NewPostgresTransactionRepository(db *gorm.DB) *PostgresTransactionRepository {
	return &PostgresTransactionRepository{db: db}
}

func (r *PostgresTransactionRepository) Create(ctx context.Context, tx *domain.Transaction) error {
	return r.db.WithContext(ctx).Create(tx).Error
}

func (r *PostgresTransactionRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.Transaction, error) {
	var tx domain.Transaction
	if err := r.db.WithContext(ctx).First(&tx, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &tx, nil
}

func (r *PostgresTransactionRepository) GetByIdempotencyKey(ctx context.Context, key string) (*domain.Transaction, error) {
	var tx domain.Transaction
	if err := r.db.WithContext(ctx).First(&tx, "idempotency_key = ?", key).Error; err != nil {
		return nil, err
	}
	return &tx, nil
}

func (r *PostgresTransactionRepository) ListByAccountID(ctx context.Context, accountID uuid.UUID, limit, offset int) ([]*domain.Transaction, int64, error) {
	var txs []*domain.Transaction
	var total int64

	query := r.db.WithContext(ctx).Model(&domain.Transaction{}).
		Where("source_account_id = ? OR destination_account_id = ?", accountID, accountID)

	query.Count(&total)
	err := query.Order("created_at DESC").Limit(limit).Offset(offset).Find(&txs).Error

	return txs, total, err
}

func (r *PostgresTransactionRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status domain.TransactionStatus) error {
	return r.db.WithContext(ctx).Model(&domain.Transaction{}).Where("id = ?", id).Update("status", status).Error
}
