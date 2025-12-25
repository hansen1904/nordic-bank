package router

import (
	"nordic-bank/internal/accounting/adapters/http"
	"nordic-bank/internal/accounting/adapters/repository"
	"nordic-bank/internal/accounting/application"
	"nordic-bank/internal/shared/database"

	"github.com/gin-gonic/gin"
	"go.opentelemetry.io/contrib/instrumentation/github.com/gin-gonic/gin/otelgin"
)

func SetupRouter() *gin.Engine {
	router := gin.Default()
	router.Use(otelgin.Middleware("account-service"))

	userRepository := &repository.PostgresUserRepository{DB: database.DB}
	userService := application.UserService{UserRepository: userRepository}
	accountHandler := &http.Handler{Service: userService}

	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
		})
	})

	api := router.Group("/api")
	{
		accountHandler.RegisterRoutes(api)
	}

	return router
}
