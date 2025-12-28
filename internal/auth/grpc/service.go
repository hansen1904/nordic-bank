package grpc

import (
	"context"

	"nordic-bank/internal/auth/application"
	"nordic-bank/internal/auth/domain"
	pb "nordic-bank/pkg/pb/auth/v1"
)

type AuthServiceServer struct {
	pb.UnimplementedAuthServiceServer
	service *application.AuthService
}

func NewAuthServiceServer(service *application.AuthService) *AuthServiceServer {
	return &AuthServiceServer{service: service}
}

func (s *AuthServiceServer) VerifyToken(ctx context.Context, req *pb.VerifyTokenRequest) (*pb.VerifyTokenResponse, error) {
	claims, err := s.service.VerifyJWT(req.Token)
	if err != nil {
		return &pb.VerifyTokenResponse{Valid: false}, nil
	}

	return &pb.VerifyTokenResponse{
		Valid: true,
		Claims: &pb.UserClaims{
			UserId:     claims.UserID,
			Username:   claims.Username,
			Email:      claims.Email,
			Role:       mapRole(claims.Role),
			CustomerId: claims.CustomerID,
		},
	}, nil
}

func mapRole(role domain.UserRole) pb.UserRole {
	switch role {
	case domain.RoleCustomer:
		return pb.UserRole_USER_ROLE_CUSTOMER
	case domain.RoleEmployee:
		return pb.UserRole_USER_ROLE_EMPLOYEE
	case domain.RoleAdmin:
		return pb.UserRole_USER_ROLE_ADMIN
	default:
		return pb.UserRole_USER_ROLE_UNSPECIFIED
	}
}

// Implement other methods as needed (GetUser, etc.) for full functionality
// check auth.proto for definition
func (s *AuthServiceServer) CheckPermission(ctx context.Context, req *pb.CheckPermissionRequest) (*pb.CheckPermissionResponse, error) {
	// Simplified permission check
	// In a real system, we'd check RBAC policies
	return &pb.CheckPermissionResponse{Allowed: true}, nil
}

func (s *AuthServiceServer) GetUser(ctx context.Context, req *pb.GetUserRequest) (*pb.GetUserResponse, error) {
	// Implementation would need GetUserByID on service
	// Omitted for brevity in this step
	return &pb.GetUserResponse{}, nil
}

func (s *AuthServiceServer) RefreshToken(ctx context.Context, req *pb.RefreshTokenRequest) (*pb.RefreshTokenResponse, error) {
	// Implementation needed
	return &pb.RefreshTokenResponse{}, nil
}
