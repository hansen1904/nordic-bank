package grpc

import (
	"context"

	"nordic-bank/internal/account/application"
	"nordic-bank/internal/account/domain"
	pb "nordic-bank/pkg/pb/account/v1"
	commonpb "nordic-bank/pkg/pb/common/v1"

	"github.com/google/uuid"
	"google.golang.org/protobuf/types/known/timestamppb"
)

type AccountServiceServer struct {
	pb.UnimplementedAccountServiceServer
	service *application.AccountService
}

func NewAccountServiceServer(service *application.AccountService) *AccountServiceServer {
	return &AccountServiceServer{service: service}
}

func (s *AccountServiceServer) CreateAccount(ctx context.Context, req *pb.CreateAccountRequest) (*pb.CreateAccountResponse, error) {
	customerID, err := uuid.Parse(req.CustomerId)
	if err != nil {
		return nil, err
	}

	account, err := s.service.CreateAccount(ctx, customerID, req.AccountName, domain.AccountType(req.AccountType), req.Currency)
	if err != nil {
		return nil, err
	}

	return &pb.CreateAccountResponse{
		Account: mapAccountToPb(account),
	}, nil
}

func (s *AccountServiceServer) GetAccount(ctx context.Context, req *pb.GetAccountRequest) (*pb.GetAccountResponse, error) {
	accountID, err := uuid.Parse(req.AccountId)
	if err != nil {
		return nil, err
	}

	account, err := s.service.GetAccount(ctx, accountID)
	if err != nil {
		return nil, err
	}

	return &pb.GetAccountResponse{
		Account: mapAccountToPb(account),
	}, nil
}

func (s *AccountServiceServer) ListAccounts(ctx context.Context, req *pb.ListAccountsRequest) (*pb.ListAccountsResponse, error) {
	customerID, err := uuid.Parse(req.CustomerId)
	if err != nil {
		return nil, err
	}

	accounts, err := s.service.ListAccounts(ctx, customerID)
	if err != nil {
		return nil, err
	}

	pbAccounts := make([]*pb.Account, len(accounts))
	for i, acc := range accounts {
		pbAccounts[i] = mapAccountToPb(acc)
	}

	return &pb.ListAccountsResponse{
		Accounts: pbAccounts,
	}, nil
}

func (s *AccountServiceServer) UpdateAccountStatus(ctx context.Context, req *pb.UpdateAccountStatusRequest) (*pb.UpdateAccountStatusResponse, error) {
	accountID, err := uuid.Parse(req.AccountId)
	if err != nil {
		return nil, err
	}

	account, err := s.service.UpdateStatus(ctx, accountID, domain.AccountStatus(req.Status))
	if err != nil {
		return nil, err
	}

	return &pb.UpdateAccountStatusResponse{
		Account: mapAccountToPb(account),
	}, nil
}

func (s *AccountServiceServer) AdjustBalance(ctx context.Context, req *pb.AdjustBalanceRequest) (*pb.AdjustBalanceResponse, error) {
	accountID, err := uuid.Parse(req.AccountId)
	if err != nil {
		return nil, err
	}

	account, err := s.service.AdjustBalance(ctx, accountID, req.AmountAdjustment, req.Reference, req.Description)
	if err != nil {
		return nil, err
	}

	return &pb.AdjustBalanceResponse{
		NewBalance: &commonpb.Money{
			Amount:   account.Balance,
			Currency: account.Currency,
		},
	}, nil
}

func mapAccountToPb(a *domain.Account) *pb.Account {
	return &pb.Account{
		Id:            a.ID.String(),
		CustomerId:    a.CustomerID.String(),
		AccountNumber: a.AccountNumber,
		AccountName:   a.AccountName,
		AccountType:   string(a.AccountType),
		Currency:      a.Currency,
		Balance: &commonpb.Money{
			Amount:   a.Balance,
			Currency: a.Currency,
		},
		AvailableBalance: &commonpb.Money{
			Amount:   a.AvailableBalance,
			Currency: a.Currency,
		},
		Status:    string(a.Status),
		CreatedAt: timestamppb.New(a.CreatedAt),
		UpdatedAt: timestamppb.New(a.UpdatedAt),
	}
}
