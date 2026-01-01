package application

import (
	"context"
	"fmt"
	"math/rand"
	"time"

	"nordic-bank/internal/account/domain"

	"github.com/google/uuid"
)

type AccountService struct {
	repo domain.AccountRepository
}

func NewAccountService(repo domain.AccountRepository) *AccountService {
	return &AccountService{repo: repo}
}

func (s *AccountService) CreateAccount(ctx context.Context, customerID uuid.UUID, name string, accType domain.AccountType, currency string) (*domain.Account, error) {
	account := &domain.Account{
		CustomerID:       customerID,
		AccountNumber:    generateAccountNumber(),
		AccountName:      name,
		AccountType:      accType,
		Currency:         currency,
		Balance:          0,
		AvailableBalance: 0,
		ReservedAmount:   0,
		Status:           domain.AccountStatusActive,
		OpenedAt:         time.Now(),
	}

	if err := s.repo.Create(ctx, account); err != nil {
		return nil, err
	}

	// Create initial ledger entry
	entry := &domain.LedgerEntry{
		AccountID:     account.ID,
		EntryType:     domain.EntryTypeCredit,
		Amount:        0,
		BalanceBefore: 0,
		BalanceAfter:  0,
		Description:   "Account opened",
		Reference:     "OPEN",
	}
	_ = s.repo.CreateLedgerEntry(ctx, entry)

	return account, nil
}

func (s *AccountService) GetAccount(ctx context.Context, id uuid.UUID) (*domain.Account, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *AccountService) ListAccounts(ctx context.Context, customerID uuid.UUID) ([]*domain.Account, error) {
	return s.repo.ListByCustomerID(ctx, customerID)
}

func (s *AccountService) UpdateStatus(ctx context.Context, id uuid.UUID, status domain.AccountStatus) (*domain.Account, error) {
	account, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	account.Status = status
	if status == domain.AccountStatusClosed {
		now := time.Now()
		account.ClosedAt = &now
	}

	if err := s.repo.Update(ctx, account); err != nil {
		return nil, err
	}

	return account, nil
}

func (s *AccountService) AdjustBalance(ctx context.Context, id uuid.UUID, adjustment int64, reference, description string) (*domain.Account, error) {
	account, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if account.Status != domain.AccountStatusActive {
		return nil, fmt.Errorf("account is not active: %s", account.Status)
	}

	balanceBefore := account.Balance
	account.Balance += adjustment
	account.AvailableBalance += adjustment

	if account.AvailableBalance < 0 {
		return nil, fmt.Errorf("insufficient funds")
	}

	if err := s.repo.Update(ctx, account); err != nil {
		return nil, err
	}

	entryType := domain.EntryTypeCredit
	if adjustment < 0 {
		entryType = domain.EntryTypeDebit
	}

	entry := &domain.LedgerEntry{
		AccountID:     account.ID,
		EntryType:     entryType,
		Amount:        adjustment,
		BalanceBefore: balanceBefore,
		BalanceAfter:  account.Balance,
		Description:   description,
		Reference:     reference,
	}
	_ = s.repo.CreateLedgerEntry(ctx, entry)

	return account, nil
}

func (s *AccountService) ToggleFavorite(ctx context.Context, id uuid.UUID) (*domain.Account, error) {
	account, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	account.IsFavorite = !account.IsFavorite

	if err := s.repo.Update(ctx, account); err != nil {
		return nil, err
	}

	return account, nil
}

func generateAccountNumber() string {
	// Simplified random account number for Denmark
	// Format: DK + 2 check digits + 14 digits
	rand.Seed(time.Now().UnixNano())
	digits := ""
	for i := 0; i < 14; i++ {
		digits += fmt.Sprintf("%d", rand.Intn(10))
	}
	return "DK99" + digits
}

func (s *AccountService) CreateRequest(ctx context.Context, customerID uuid.UUID, requestedType domain.AccountType, reason string) (*domain.AccountRequest, error) {
	req := &domain.AccountRequest{
		CustomerID:    customerID,
		RequestedType: requestedType,
		Status:        domain.RequestStatusPending,
		Reason:        reason,
	}

	if err := s.repo.CreateRequest(ctx, req); err != nil {
		return nil, err
	}

	return req, nil
}

func (s *AccountService) GetRequests(ctx context.Context, status *domain.RequestStatus) ([]*domain.AccountRequest, error) {
	return s.repo.ListRequests(ctx, status)
}

func (s *AccountService) UpdateRequestStatus(ctx context.Context, id uuid.UUID, status domain.RequestStatus, processedBy uuid.UUID) (*domain.AccountRequest, error) {
	req, err := s.repo.GetRequestByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if req.Status != domain.RequestStatusPending {
		return nil, fmt.Errorf("request is already processed: %s", req.Status)
	}

	req.Status = status
	now := time.Now()
	req.ProcessedAt = &now
	req.ProcessedBy = &processedBy

	if err := s.repo.UpdateRequest(ctx, req); err != nil {
		return nil, err
	}

	// If approved, create the account automatically
	if status == domain.RequestStatusApproved {
		_, err := s.CreateAccount(ctx, req.CustomerID, string(req.RequestedType)+" Account", req.RequestedType, "DKK")
		if err != nil {
			// In a real system we might want to transactionally rollback the request update
			// For now, we return error but the request is marked approved.
			// Ideally we should use a transaction here.
			return nil, fmt.Errorf("failed to create account for approved request: %v", err)
		}
	}

	return req, nil
}
