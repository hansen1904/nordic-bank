package main

import (
	"fmt"
	"log"
	"net"
	"os"
	"os/signal"
	"syscall"

	"nordic-bank/internal/account/adapter"
	"nordic-bank/internal/account/application"
	"nordic-bank/internal/account/domain"
	accountgrpc "nordic-bank/internal/account/grpc"
	accounthttp "nordic-bank/internal/account/http"
	sharedauth "nordic-bank/internal/shared/auth"
	"nordic-bank/internal/shared/database"
	pb "nordic-bank/pkg/pb/account/v1"

	"github.com/gin-gonic/gin"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
)

func main() {
	// Initialize Database
	database.InitDB()
	db := database.DB

	// Create Account Schema
	if err := db.Exec("CREATE SCHEMA IF NOT EXISTS account").Error; err != nil {
		log.Fatalf("failed to create account schema: %v", err)
	}

	// Create UUID extension just in case
	db.Exec("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"")

	// Create Custom Types (safely)
	enumQueries := []string{
		`DO $$ BEGIN
			CREATE TYPE account.account_type AS ENUM ('checking', 'savings', 'investment', 'loan');
		EXCEPTION
			WHEN duplicate_object THEN null;
		END $$;`,
		`DO $$ BEGIN
			CREATE TYPE account.account_status AS ENUM ('active', 'frozen', 'closed', 'dormant');
		EXCEPTION
			WHEN duplicate_object THEN null;
		END $$;`,
	}

	for _, query := range enumQueries {
		if err := db.Exec(query).Error; err != nil {
			log.Printf("warning: failed to create enum type: %v", err)
		}
	}

	// Run Migrations for Account Service
	if err := db.AutoMigrate(&domain.Account{}, &domain.LedgerEntry{}, &domain.AccountRequest{}); err != nil {
		log.Fatalf("failed to migrate account database: %v", err)
	}

	// Initialize Dependencies
	repo := adapter.NewPostgresAccountRepository(db)
	service := application.NewAccountService(repo)

	// Error channel for servers
	errChan := make(chan error, 2)

	// Start HTTP Server
	go func() {
		router := gin.Default()

		// Disable trailing slash redirect to prevent CORS issues
		router.RedirectTrailingSlash = false

		// Apply CORS middleware
		router.Use(sharedauth.CORSMiddleware())
		log.Println("CORS Middleware applied")

		handler := accounthttp.NewHandler(service)
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
		accountServer := accountgrpc.NewAccountServiceServer(service)
		pb.RegisterAccountServiceServer(grpcServer, accountServer)

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
