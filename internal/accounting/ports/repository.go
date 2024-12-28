package ports

import "nordic-bank/internal/accounting/domain"

type UserRepository interface {
	CreateUser(user *domain.User) error
}
