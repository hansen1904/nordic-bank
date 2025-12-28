package main

import (
	"context"
	"fmt"
	"log"
	"net"
	"os"
	"os/signal"
	"syscall"

	"nordic-bank/internal/auth/adapter"
	"nordic-bank/internal/auth/application"
	"nordic-bank/internal/auth/domain"
	authgrpc "nordic-bank/internal/auth/grpc"
	authhttp "nordic-bank/internal/auth/http"
	sharedauth "nordic-bank/internal/shared/auth"
	"nordic-bank/internal/shared/database"
	pb "nordic-bank/pkg/pb/auth/v1"

	"github.com/gin-gonic/gin"
	"google.golang.org/grpc"
)

func main() {
	// Initialize Database
	database.InitDB()
	db := database.DB

	// Create Auth Schema
	if err := db.Exec("CREATE SCHEMA IF NOT EXISTS auth").Error; err != nil {
		log.Fatalf("failed to create auth schema: %v", err)
	}

	// Create UUID extension just in case
	db.Exec("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"")

	// Create Custom Types (safely)
	// We use an anonymous block to handle "IF NOT EXISTS" for types which isn't directly supported in older Postgres versions or standard SQL
	enumQueries := []string{
		`DO $$ BEGIN
			CREATE TYPE auth.user_role AS ENUM ('customer', 'employee', 'admin');
		EXCEPTION
			WHEN duplicate_object THEN null;
		END $$;`,
		`DO $$ BEGIN
			CREATE TYPE auth.user_status AS ENUM ('active', 'inactive', 'suspended', 'locked', 'closed');
		EXCEPTION
			WHEN duplicate_object THEN null;
		END $$;`,
	}

	for _, query := range enumQueries {
		if err := db.Exec(query).Error; err != nil {
			log.Printf("warning: failed to create enum type: %v", err)
		}
	}

	// Run Migrations for Auth Service
	if err := db.AutoMigrate(&domain.User{}, &domain.Session{}); err != nil {
		log.Fatalf("failed to migrate auth database: %v", err)
	}

	// Initialize Dependencies
	userRepo := adapter.NewPostgresUserRepository(db)
	sessionRepo := adapter.NewPostgresSessionRepository(db)

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "default-development-secret-do-not-use-in-prod"
	}

	authService := application.NewAuthService(userRepo, sessionRepo, jwtSecret)

	// Seed Default Employee
	if err := authService.SeedDefaultEmployee(context.Background(), "admin", "admin@nordicbank.com", "Admin123!"); err != nil {
		log.Printf("warning: failed to seed default employee: %v", err)
	}

	// Error channel for servers
	errChan := make(chan error, 2)

	// Start HTTP Server
	go func() {
		router := gin.Default()

		// Allow CORS
		router.Use(sharedauth.CORSMiddleware())

		handler := authhttp.NewHandler(authService, jwtSecret)
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
		authServer := authgrpc.NewAuthServiceServer(authService)
		pb.RegisterAuthServiceServer(grpcServer, authServer)

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
