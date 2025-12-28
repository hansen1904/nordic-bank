package application

import (
	"context"
	"errors"
	"time"

	"nordic-bank/internal/customer/domain"

	"github.com/google/uuid"
)

type CustomerService struct {
	repo domain.CustomerRepository
}

func NewCustomerService(repo domain.CustomerRepository) *CustomerService {
	return &CustomerService{repo: repo}
}

func (s *CustomerService) CreateCustomer(ctx context.Context, userID uuid.UUID, firstName, lastName, email, phone, dob string, address domain.Address) (*domain.Customer, error) {
	parsedDOB, err := time.Parse("2006-01-02", dob)
	if err != nil {
		return nil, errors.New("invalid date of birth format, use YYYY-MM-DD")
	}

	customer := &domain.Customer{
		UserID:            userID,
		FirstName:         firstName,
		LastName:          lastName,
		Email:             email,
		Phone:             phone,
		DateOfBirth:       parsedDOB,
		AddressStreet:     address.Street,
		AddressCity:       address.City,
		AddressPostalCode: address.PostalCode,
		AddressCountry:    address.Country,
		KycStatus:         domain.KycStatusPending,
		Status:            domain.CustomerStatusActive,
	}

	if err := s.repo.Create(ctx, customer); err != nil {
		return nil, err
	}

	return customer, nil
}

func (s *CustomerService) GetCustomerByUserID(ctx context.Context, userID uuid.UUID) (*domain.Customer, error) {
	return s.repo.GetByUserID(ctx, userID)
}

func (s *CustomerService) UpdateCustomer(ctx context.Context, userID uuid.UUID, firstName, lastName, phone *string, address *domain.Address) (*domain.Customer, error) {
	customer, err := s.repo.GetByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	if firstName != nil {
		customer.FirstName = *firstName
	}
	if lastName != nil {
		customer.LastName = *lastName
	}
	if phone != nil {
		customer.Phone = *phone
	}
	if address != nil {
		customer.AddressStreet = address.Street
		customer.AddressCity = address.City
		customer.AddressPostalCode = address.PostalCode
		customer.AddressCountry = address.Country
	}

	if err := s.repo.Update(ctx, customer); err != nil {
		return nil, err
	}

	return customer, nil
}

func (s *CustomerService) UpdateKycStatus(ctx context.Context, userID uuid.UUID, status domain.KycStatus, notes string) error {
	customer, err := s.repo.GetByUserID(ctx, userID)
	if err != nil {
		return err
	}

	customer.KycStatus = status
	customer.KycNotes = notes
	if status == domain.KycStatusVerified {
		now := time.Now()
		customer.KycVerifiedAt = &now
	}

	return s.repo.Update(ctx, customer)
}
