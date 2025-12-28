package main

import (
	"fmt"
	"log"
	"net"
	"os"
	"os/signal"
	"syscall"

	"nordic-bank/internal/shared/database"
	"nordic-bank/internal/transaction/adapter"
	"nordic-bank/internal/transaction/application"
	"nordic-bank/internal/transaction/domain"
	txgrpc "nordic-bank/internal/transaction/grpc"
	txhttp "nordic-bank/internal/transaction/http"
	accountpb "nordic-bank/pkg/pb/account/v1"
	pb "nordic-bank/pkg/pb/transaction/v1"

	"github.com/gin-gonic/gin"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/reflection"
)

func main() {
	// Initialize Database
	database.InitDB()
	db := database.DB

	// Create Transaction Schema
	if err := db.Exec("CREATE SCHEMA IF NOT EXISTS transaction").Error; err != nil {
		log.Fatalf("failed to create transaction schema: %v", err)
	}

	// Create Custom Types (safely)
	enumQueries := []string{
		`DO $$ BEGIN
			CREATE TYPE transaction.transaction_type AS ENUM ('transfer', 'deposit', 'withdrawal', 'payment');
		EXCEPTION
			WHEN duplicate_object THEN null;
		END $$;`,
		`DO $$ BEGIN
			CREATE TYPE transaction.transaction_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');
		EXCEPTION
			WHEN duplicate_object THEN null;
		END $$;`,
	}

	for _, query := range enumQueries {
		if err := db.Exec(query).Error; err != nil {
			log.Printf("warning: failed to create enum type: %v", err)
		}
	}

	// Run Migrations for Transaction Service
	if err := db.AutoMigrate(&domain.Transaction{}); err != nil {
		log.Fatalf("failed to migrate transaction database: %v", err)
	}

	// Initialize Account gRPC Client
	accountSvcAddr := os.Getenv("ACCOUNT_SERVICE_ADDR")
	if accountSvcAddr == "" {
		accountSvcAddr = "account-service-v2:9083"
	}

	conn, err := grpc.Dial(accountSvcAddr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatalf("did not connect to account service: %v", err)
	}
	defer conn.Close()
	accountClient := accountpb.NewAccountServiceClient(conn)

	// Initialize Dependencies
	repo := adapter.NewPostgresTransactionRepository(db)
	service := application.NewTransactionService(repo, accountClient)

	// Error channel for servers
	errChan := make(chan error, 2)

	// Start HTTP Server
	go func() {
		router := gin.Default()

		handler := txhttp.NewHandler(service)
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
		transactionServer := txgrpc.NewTransactionServiceServer(service)
		pb.RegisterTransactionServiceServer(grpcServer, transactionServer)

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
