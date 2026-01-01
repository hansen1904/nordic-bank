package adapter

import (
	"context"

	"nordic-bank/internal/account/domain"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PostgresAccountRepository struct {
	db *gorm.DB
}

func NewPostgresAccountRepository(db *gorm.DB) *PostgresAccountRepository {
	return &PostgresAccountRepository{db: db}
}

func (r *PostgresAccountRepository) Create(ctx context.Context, account *domain.Account) error {
	return r.db.WithContext(ctx).Create(account).Error
}

func (r *PostgresAccountRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.Account, error) {
	var account domain.Account
	if err := r.db.WithContext(ctx).First(&account, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &account, nil
}

func (r *PostgresAccountRepository) GetByAccountNumber(ctx context.Context, number string) (*domain.Account, error) {
	var account domain.Account
	if err := r.db.WithContext(ctx).First(&account, "account_number = ?", number).Error; err != nil {
		return nil, err
	}
	return &account, nil
}

func (r *PostgresAccountRepository) ListByCustomerID(ctx context.Context, customerID uuid.UUID) ([]*domain.Account, error) {
	var accounts []*domain.Account
	if err := r.db.WithContext(ctx).Find(&accounts, "customer_id = ?", customerID).Error; err != nil {
		return nil, err
	}
	return accounts, nil
}

func (r *PostgresAccountRepository) Update(ctx context.Context, account *domain.Account) error {
	return r.db.WithContext(ctx).Save(account).Error
}

func (r *PostgresAccountRepository) CreateLedgerEntry(ctx context.Context, entry *domain.LedgerEntry) error {
	return r.db.WithContext(ctx).Create(entry).Error
}

func (r *PostgresAccountRepository) CreateRequest(ctx context.Context, req *domain.AccountRequest) error {
	return r.db.WithContext(ctx).Create(req).Error
}

func (r *PostgresAccountRepository) GetRequestByID(ctx context.Context, id uuid.UUID) (*domain.AccountRequest, error) {
	var req domain.AccountRequest
	if err := r.db.WithContext(ctx).First(&req, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &req, nil
}

func (r *PostgresAccountRepository) ListRequests(ctx context.Context, status *domain.RequestStatus) ([]*domain.AccountRequest, error) {
	var requests []*domain.AccountRequest
	query := r.db.WithContext(ctx)
	if status != nil {
		query = query.Where("status = ?", *status)
	}
	if err := query.Order("created_at desc").Find(&requests).Error; err != nil {
		return nil, err
	}
	return requests, nil
}

func (r *PostgresAccountRepository) UpdateRequest(ctx context.Context, req *domain.AccountRequest) error {
	return r.db.WithContext(ctx).Save(req).Error
}
