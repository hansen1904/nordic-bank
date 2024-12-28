package ports

import "nordic-bank/internal/accounting/domain"

type UserService interface {
	CreateUser(user *domain.User) error
}
