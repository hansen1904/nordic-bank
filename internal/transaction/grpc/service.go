package grpc

import (
	"context"

	"nordic-bank/internal/transaction/application"
	"nordic-bank/internal/transaction/domain"
	commonpb "nordic-bank/pkg/pb/common/v1"
	pb "nordic-bank/pkg/pb/transaction/v1"

	"github.com/google/uuid"
	"google.golang.org/protobuf/types/known/timestamppb"
)

type TransactionServiceServer struct {
	pb.UnimplementedTransactionServiceServer
	service *application.TransactionService
}

func NewTransactionServiceServer(service *application.TransactionService) *TransactionServiceServer {
	return &TransactionServiceServer{service: service}
}

func (s *TransactionServiceServer) CreateTransfer(ctx context.Context, req *pb.CreateTransferRequest) (*pb.CreateTransferResponse, error) {
	srcID, err := uuid.Parse(req.SourceAccountId)
	if err != nil {
		return nil, err
	}
	dstID, err := uuid.Parse(req.DestinationAccountId)
	if err != nil {
		return nil, err
	}

	tx, err := s.service.CreateTransfer(ctx, srcID, dstID, req.Amount.Amount, req.Amount.Currency, req.Reference, req.Description, req.IdempotencyKey)
	if err != nil {
		return nil, err
	}

	return &pb.CreateTransferResponse{
		Transaction: mapTransactionToPb(tx),
	}, nil
}

func (s *TransactionServiceServer) GetTransaction(ctx context.Context, req *pb.GetTransactionRequest) (*pb.GetTransactionResponse, error) {
	id, err := uuid.Parse(req.TransactionId)
	if err != nil {
		return nil, err
	}

	tx, err := s.service.GetTransaction(ctx, id)
	if err != nil {
		return nil, err
	}

	return &pb.GetTransactionResponse{
		Transaction: mapTransactionToPb(tx),
	}, nil
}

func (s *TransactionServiceServer) ListTransactions(ctx context.Context, req *pb.ListTransactionsRequest) (*pb.ListTransactionsResponse, error) {
	accountID, err := uuid.Parse(req.AccountId)
	if err != nil {
		return nil, err
	}

	page := int(req.Pagination.Page)
	if page <= 0 {
		page = 1
	}
	pageSize := int(req.Pagination.PageSize)
	if pageSize <= 0 {
		pageSize = 10
	}

	txs, total, err := s.service.ListTransactions(ctx, accountID, page, pageSize)
	if err != nil {
		return nil, err
	}

	pbTxs := make([]*pb.Transaction, len(txs))
	for i, tx := range txs {
		pbTxs[i] = mapTransactionToPb(tx)
	}

	return &pb.ListTransactionsResponse{
		Transactions: pbTxs,
		Pagination: &commonpb.PaginationResponse{
			Page:       int32(page),
			PageSize:   int32(pageSize),
			TotalItems: int32(total),
			TotalPages: int32((total + int64(pageSize) - 1) / int64(pageSize)),
		},
	}, nil
}

func mapTransactionToPb(t *domain.Transaction) *pb.Transaction {
	srcID := ""
	if t.SourceAccountID != nil {
		srcID = t.SourceAccountID.String()
	}
	dstID := ""
	if t.DestinationAccountID != nil {
		dstID = t.DestinationAccountID.String()
	}

	return &pb.Transaction{
		Id:                   t.ID.String(),
		SourceAccountId:      srcID,
		DestinationAccountId: dstID,
		Amount: &commonpb.Money{
			Amount:   t.Amount,
			Currency: t.Currency,
		},
		Type:           string(t.Type),
		Status:         string(t.Status),
		Reference:      t.Reference,
		Description:    t.Description,
		IdempotencyKey: t.IdempotencyKey,
		CreatedAt:      timestamppb.New(t.CreatedAt),
		UpdatedAt:      timestamppb.New(t.UpdatedAt),
	}
}
