package http

import (
	"net/http"

	"nordic-bank/internal/customer/application"
	"nordic-bank/internal/customer/domain"
	sharedauth "nordic-bank/internal/shared/auth"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type Handler struct {
	service   *application.CustomerService
	jwtSecret []byte
}

func NewHandler(service *application.CustomerService, jwtSecret string) *Handler {
	return &Handler{
		service:   service,
		jwtSecret: []byte(jwtSecret),
	}
}

func (h *Handler) RegisterRoutes(router *gin.Engine) {
	customer := router.Group("/api/v1/customers")
	{
		// Only employees can create customers
		customer.POST("/", sharedauth.AuthMiddleware(h.jwtSecret), sharedauth.RoleMiddleware("employee"), h.createCustomer)

		// This should also be protected or filtered by userID from token
		customer.GET("/me", h.getMe)
	}
}

type createCustomerRequest struct {
	UserID      string `json:"user_id" binding:"required"`
	FirstName   string `json:"first_name" binding:"required"`
	LastName    string `json:"last_name" binding:"required"`
	Email       string `json:"email" binding:"required,email"`
	Phone       string `json:"phone" binding:"required"`
	DateOfBirth string `json:"date_of_birth" binding:"required"` // YYYY-MM-DD
	Address     struct {
		Street     string `json:"street"`
		City       string `json:"city"`
		PostalCode string `json:"postal_code"`
		Country    string `json:"country"`
	} `json:"address"`
}

func (h *Handler) createCustomer(c *gin.Context) {
	var req createCustomerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, err := uuid.Parse(req.UserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user_id"})
		return
	}

	addr := domain.Address{
		Street:     req.Address.Street,
		City:       req.Address.City,
		PostalCode: req.Address.PostalCode,
		Country:    req.Address.Country,
	}

	customer, err := h.service.CreateCustomer(c.Request.Context(), userID, req.FirstName, req.LastName, req.Email, req.Phone, req.DateOfBirth, addr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, customer)
}

func (h *Handler) getMe(c *gin.Context) {
	// Dummy implementation until we have auth middleware here
	userIDStr := c.Query("user_id")
	if userIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id is required as query param for testing"})
		return
	}

	userID, _ := uuid.Parse(userIDStr)
	customer, err := h.service.GetCustomerByUserID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "customer not found"})
		return
	}

	c.JSON(http.StatusOK, customer)
}
