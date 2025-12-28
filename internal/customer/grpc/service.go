package grpc

import (
	"context"

	"nordic-bank/internal/customer/application"
	"nordic-bank/internal/customer/domain"
	commonpb "nordic-bank/pkg/pb/common/v1"
	pb "nordic-bank/pkg/pb/customer/v1"

	"github.com/google/uuid"
	"google.golang.org/protobuf/types/known/timestamppb"
)

type CustomerServiceServer struct {
	pb.UnimplementedCustomerServiceServer
	service *application.CustomerService
}

func NewCustomerServiceServer(service *application.CustomerService) *CustomerServiceServer {
	return &CustomerServiceServer{service: service}
}

func (s *CustomerServiceServer) CreateCustomer(ctx context.Context, req *pb.CreateCustomerRequest) (*pb.CreateCustomerResponse, error) {
	userID, err := uuid.Parse(req.UserId)
	if err != nil {
		return nil, err
	}

	addr := domain.Address{}
	if req.Address != nil {
		addr.Street = req.Address.Street
		addr.City = req.Address.City
		addr.PostalCode = req.Address.PostalCode
		addr.Country = req.Address.Country
	}

	customer, err := s.service.CreateCustomer(ctx, userID, req.FirstName, req.LastName, req.Email, req.Phone, req.DateOfBirth, addr)
	if err != nil {
		return nil, err
	}

	return &pb.CreateCustomerResponse{
		Customer: mapCustomerToPb(customer),
	}, nil
}

func (s *CustomerServiceServer) GetCustomerByUserId(ctx context.Context, req *pb.GetCustomerByUserIdRequest) (*pb.GetCustomerByUserIdResponse, error) {
	userID, err := uuid.Parse(req.UserId)
	if err != nil {
		return nil, err
	}

	customer, err := s.service.GetCustomerByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	return &pb.GetCustomerByUserIdResponse{
		Customer: mapCustomerToPb(customer),
	}, nil
}

func mapCustomerToPb(c *domain.Customer) *pb.Customer {
	return &pb.Customer{
		Id:          c.ID.String(),
		UserId:      c.UserID.String(),
		FirstName:   c.FirstName,
		LastName:    c.LastName,
		Email:       c.Email,
		Phone:       c.Phone,
		DateOfBirth: c.DateOfBirth.Format("2006-01-02"),
		KycStatus:   string(c.KycStatus),
		Address: &commonpb.Address{
			Street:     c.AddressStreet,
			City:       c.AddressCity,
			PostalCode: c.AddressPostalCode,
			Country:    c.AddressCountry,
		},
		CreatedAt: timestamppb.New(c.CreatedAt),
		UpdatedAt: timestamppb.New(c.UpdatedAt),
	}
}
