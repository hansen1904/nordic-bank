package http

import (
	"nordic-bank/internal/accounting/application"
	"nordic-bank/internal/accounting/domain"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	Service application.UserService
}

type registerRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

func (h *Handler) RegisterRoutes(r *gin.RouterGroup) {
	r.POST("/accounts/register", h.registerAccount)
}

func (h *Handler) registerAccount(c *gin.Context) {
	var request registerRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	user := domain.User{
		Username: request.Username,
		Password: request.Password,
	}

	if err := h.Service.CreateUser(&user); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(201, gin.H{
		"message": "User registered successfully",
	})
}
