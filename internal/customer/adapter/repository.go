package adapter

import (
	"context"

	"nordic-bank/internal/customer/domain"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PostgresCustomerRepository struct {
	db *gorm.DB
}

func NewPostgresCustomerRepository(db *gorm.DB) *PostgresCustomerRepository {
	return &PostgresCustomerRepository{db: db}
}

func (r *PostgresCustomerRepository) Create(ctx context.Context, customer *domain.Customer) error {
	return r.db.WithContext(ctx).Create(customer).Error
}

func (r *PostgresCustomerRepository) GetByUserID(ctx context.Context, userID uuid.UUID) (*domain.Customer, error) {
	var customer domain.Customer
	if err := r.db.WithContext(ctx).First(&customer, "user_id = ?", userID).Error; err != nil {
		return nil, err
	}
	return &customer, nil
}

func (r *PostgresCustomerRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.Customer, error) {
	var customer domain.Customer
	if err := r.db.WithContext(ctx).First(&customer, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &customer, nil
}

func (r *PostgresCustomerRepository) Update(ctx context.Context, customer *domain.Customer) error {
	return r.db.WithContext(ctx).Save(customer).Error
}
