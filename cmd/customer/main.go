package main

import (
	"fmt"
	"log"
	"net"
	"os"
	"os/signal"
	"syscall"

	"nordic-bank/internal/customer/adapter"
	"nordic-bank/internal/customer/application"
	"nordic-bank/internal/customer/domain"
	customergrpc "nordic-bank/internal/customer/grpc"
	customerhttp "nordic-bank/internal/customer/http"
	sharedauth "nordic-bank/internal/shared/auth"
	"nordic-bank/internal/shared/database"
	pb "nordic-bank/pkg/pb/customer/v1"

	"github.com/gin-gonic/gin"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/reflection"

	authpb "nordic-bank/pkg/pb/auth/v1"
)

func main() {
	// Initialize Database
	database.InitDB()
	db := database.DB

	// Create Customer Schema
	if err := db.Exec("CREATE SCHEMA IF NOT EXISTS customer").Error; err != nil {
		log.Fatalf("failed to create customer schema: %v", err)
	}

	// Create UUID extension just in case
	db.Exec("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"")

	// Create Custom Types (safely)
	enumQueries := []string{
		`DO $$ BEGIN
			CREATE TYPE customer.kyc_status AS ENUM ('pending', 'in_review', 'verified', 'rejected', 'expired');
		EXCEPTION
			WHEN duplicate_object THEN null;
		END $$;`,
		`DO $$ BEGIN
			CREATE TYPE customer.customer_status AS ENUM ('active', 'inactive', 'suspended', 'closed');
		EXCEPTION
			WHEN duplicate_object THEN null;
		END $$;`,
	}

	for _, query := range enumQueries {
		if err := db.Exec(query).Error; err != nil {
			log.Printf("warning: failed to create enum type: %v", err)
		}
	}

	// Run Migrations for Customer Service
	if err := db.AutoMigrate(&domain.Customer{}); err != nil {
		log.Fatalf("failed to migrate customer database: %v", err)
	}

	// Initialize Auth gRPC Client
	authSvcAddr := os.Getenv("AUTH_SERVICE_ADDR")
	if authSvcAddr == "" {
		authSvcAddr = "auth-service-v2:9080"
	}

	authConn, err := grpc.Dial(authSvcAddr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatalf("did not connect to auth service: %v", err)
	}
	defer authConn.Close()
	authClient := authpb.NewAuthServiceClient(authConn)

	// Initialize Dependencies
	repo := adapter.NewPostgresCustomerRepository(db)
	service := application.NewCustomerService(repo, authClient)

	// Error channel for servers
	errChan := make(chan error, 2)

	// Start HTTP Server
	go func() {
		router := gin.Default()
		router.Use(sharedauth.CORSMiddleware())

		jwtSecret := os.Getenv("JWT_SECRET")
		if jwtSecret == "" {
			jwtSecret = "default-development-secret-do-not-use-in-prod"
		}

		handler := customerhttp.NewHandler(service, jwtSecret)
		handler.RegisterRoutes(router)

		httpPort := os.Getenv("HTTP_PORT")
		if httpPort == "" {
			httpPort = "8080"
		}

		log.Printf("HTTP server starting on :%s", httpPort)
		errChan <- router.Run(":" + httpPort)
	}()

	// Start gRPC Server
	go func() {
		grpcPort := os.Getenv("GRPC_PORT")
		if grpcPort == "" {
			grpcPort = "9080"
		}

		lis, err := net.Listen("tcp", ":"+grpcPort)
		if err != nil {
			errChan <- fmt.Errorf("failed to listen on gRPC port: %v", err)
			return
		}

		grpcServer := grpc.NewServer()
		customerServer := customergrpc.NewCustomerServiceServer(service)
		pb.RegisterCustomerServiceServer(grpcServer, customerServer)

		// Register reflection service on gRPC server.
		reflection.Register(grpcServer)

		log.Printf("gRPC server starting on :%s", grpcPort)
		errChan <- grpcServer.Serve(lis)
	}()

	// Graceful Shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	select {
	case err := <-errChan:
		log.Fatalf("Server error: %v", err)
	case <-quit:
		log.Println("Shutting down servers...")
	}
}
