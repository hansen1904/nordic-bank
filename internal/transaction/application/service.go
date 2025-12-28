package application

import (
	"context"
	"fmt"

	"nordic-bank/internal/transaction/domain"
	accountpb "nordic-bank/pkg/pb/account/v1"

	"github.com/google/uuid"
)

type TransactionService struct {
	repo          domain.TransactionRepository
	accountClient accountpb.AccountServiceClient
}

func NewTransactionService(repo domain.TransactionRepository, accountClient accountpb.AccountServiceClient) *TransactionService {
	return &TransactionService{
		repo:          repo,
		accountClient: accountClient,
	}
}

func (s *TransactionService) CreateTransfer(ctx context.Context, srcID, dstID uuid.UUID, amount int64, currency, reference, description, idempotencyKey string) (*domain.Transaction, error) {
	// 1. Check idempotency
	if existing, err := s.repo.GetByIdempotencyKey(ctx, idempotencyKey); err == nil {
		return existing, nil
	}

	// 2. Initial Transaction Record (Pending)
	tx := &domain.Transaction{
		SourceAccountID:      &srcID,
		DestinationAccountID: &dstID,
		Amount:               amount,
		Currency:             currency,
		Type:                 domain.TypeTransfer,
		Status:               domain.StatusPending,
		Reference:            reference,
		Description:          description,
		IdempotencyKey:       idempotencyKey,
	}

	if err := s.repo.Create(ctx, tx); err != nil {
		return nil, err
	}

	// 3. Perform the actual balance updates via Account Service

	// Step 1: Debit Source
	_, err := s.accountClient.AdjustBalance(ctx, &accountpb.AdjustBalanceRequest{
		AccountId:        srcID.String(),
		AmountAdjustment: -amount,
		Reference:        tx.ID.String(),
		Description:      fmt.Sprintf("Transfer to %s: %s", dstID.String(), description),
	})

	if err != nil {
		tx.Status = domain.StatusFailed
		tx.Description = fmt.Sprintf("Debit failed: %v", err)
		_ = s.repo.UpdateStatus(ctx, tx.ID, domain.StatusFailed)
		return tx, fmt.Errorf("debit failed: %w", err)
	}

	// Step 2: Credit Destination
	_, err = s.accountClient.AdjustBalance(ctx, &accountpb.AdjustBalanceRequest{
		AccountId:        dstID.String(),
		AmountAdjustment: amount,
		Reference:        tx.ID.String(),
		Description:      fmt.Sprintf("Transfer from %s: %s", srcID.String(), description),
	})

	if err != nil {
		// Compensation: Re-credit Source
		_, rollbackErr := s.accountClient.AdjustBalance(ctx, &accountpb.AdjustBalanceRequest{
			AccountId:        srcID.String(),
			AmountAdjustment: amount,
			Reference:        tx.ID.String(),
			Description:      "ROLLBACK: Credit failed",
		})

		tx.Status = domain.StatusFailed
		tx.Description = fmt.Sprintf("Credit failed: %v. Rollback success: %v", err, rollbackErr == nil)
		_ = s.repo.UpdateStatus(ctx, tx.ID, domain.StatusFailed)

		return tx, fmt.Errorf("credit failed, attempt rollback: %w", err)
	}

	// Step 3: Success
	tx.Status = domain.StatusCompleted
	if err := s.repo.UpdateStatus(ctx, tx.ID, domain.StatusCompleted); err != nil {
		return tx, err
	}

	return tx, nil
}

func (s *TransactionService) GetTransaction(ctx context.Context, id uuid.UUID) (*domain.Transaction, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *TransactionService) ListTransactions(ctx context.Context, accountID uuid.UUID, page, pageSize int) ([]*domain.Transaction, int64, error) {
	offset := (page - 1) * pageSize
	return s.repo.ListByAccountID(ctx, accountID, pageSize, offset)
}
