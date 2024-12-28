package repository

import (
	"nordic-bank/internal/accounting/domain"

	"gorm.io/gorm"
)

type PostgresUserRepository struct {
	DB *gorm.DB
}

func (r *PostgresUserRepository) CreateUser(user *domain.User) error {
	return r.DB.Create(user).Error
}
