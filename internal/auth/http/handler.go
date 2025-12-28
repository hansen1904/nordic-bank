package http

import (
	"context"
	"net/http"

	"nordic-bank/internal/auth/domain"
	sharedauth "nordic-bank/internal/shared/auth"

	"github.com/gin-gonic/gin"
)

// AuthService defines the interface for authentication operations
type AuthService interface {
	Register(ctx context.Context, username, email, password string, role domain.UserRole) (*domain.User, error)
	Login(ctx context.Context, email, password, ipAddress, userAgent string) (*domain.User, string, string, error)
}

type Handler struct {
	service   AuthService
	jwtSecret []byte
}

func NewHandler(service AuthService, jwtSecret string) *Handler {
	return &Handler{
		service:   service,
		jwtSecret: []byte(jwtSecret),
	}
}

func (h *Handler) RegisterRoutes(router *gin.Engine) {
	auth := router.Group("/api/v1/auth")
	{
		auth.POST("/login", h.login)

		// P1 FIX: Public customer registration (no auth required)
		auth.POST("/register", h.registerCustomer)

		// Protected employee registration (requires employee auth)
		auth.POST("/register/employee", sharedauth.AuthMiddleware(h.jwtSecret), sharedauth.RoleMiddleware("employee"), h.registerEmployee)
	}
}

type registerRequest struct {
	Username  string `json:"username" binding:"required"`
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"password" binding:"required,min=8"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
}

// P1 FIX: Public customer registration (no auth required)
func (h *Handler) registerCustomer(c *gin.Context) {
	var req registerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Force customer role for public registration
	user, err := h.service.Register(c.Request.Context(), req.Username, req.Email, req.Password, domain.RoleCustomer)
	if err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"id":       user.ID,
		"username": user.Username,
		"email":    user.Email,
	})
}

// Protected employee registration (requires employee auth)
type registerEmployeeRequest struct {
	Username string `json:"username" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
	Role     string `json:"role" binding:"required"`
}

func (h *Handler) registerEmployee(c *gin.Context) {
	var req registerEmployeeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	role := domain.UserRole(req.Role)
	if role != domain.RoleCustomer && role != domain.RoleEmployee { // Only allow these for now
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid role"})
		return
	}

	user, err := h.service.Register(c.Request.Context(), req.Username, req.Email, req.Password, role)
	if err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"id":       user.ID,
		"username": user.Username,
		"email":    user.Email,
	})
}

type loginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func (h *Handler) login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ipAddress := c.ClientIP()
	userAgent := c.Request.UserAgent()

	user, accessToken, refreshToken, err := h.service.Login(c.Request.Context(), req.Email, req.Password, ipAddress, userAgent)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"access_token":  accessToken,
		"refresh_token": refreshToken,
		"token_type":    "Bearer",
		"expires_in":    3600, // 1 hour for now
		"user_id":       user.ID,
		"role":          user.Role,
	})
}
