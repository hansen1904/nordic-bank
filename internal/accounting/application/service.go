package application

import (
	"nordic-bank/internal/accounting/domain"
	"nordic-bank/internal/accounting/ports"
)

type UserService struct {
	UserRepository ports.UserRepository
}

func (s *UserService) CreateUser(user *domain.User) error {
	return s.UserRepository.CreateUser(user)
}
