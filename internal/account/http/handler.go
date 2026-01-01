package http

import (
	"net/http"

	"nordic-bank/internal/account/application"
	"nordic-bank/internal/account/domain"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type Handler struct {
	service *application.AccountService
}

func NewHandler(service *application.AccountService) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterRoutes(router *gin.Engine) {
	acc := router.Group("/api/v1/accounts")
	{
		acc.POST("", h.createAccount)
		acc.GET("", h.listAccounts)
		acc.GET("/:id", h.getAccount)
		acc.PATCH("/:id/status", h.updateStatus)
		acc.PUT("/:id/favorite", h.toggleFavorite)
	}

	req := router.Group("/api/v1/requests")
	{
		req.POST("", h.createRequest)
		req.GET("", h.listRequests)
		req.PUT("/:id/status", h.updateRequestStatus)
	}
}

type createAccountRequest struct {
	CustomerID  string `json:"customer_id" binding:"required"`
	AccountName string `json:"account_name" binding:"required"`
	AccountType string `json:"account_type" binding:"required"`
	Currency    string `json:"currency" binding:"required"`
}

func (h *Handler) createAccount(c *gin.Context) {
	var req createAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	customerID, err := uuid.Parse(req.CustomerID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid customer_id"})
		return
	}

	account, err := h.service.CreateAccount(c.Request.Context(), customerID, req.AccountName, domain.AccountType(req.AccountType), req.Currency)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, account)
}

func (h *Handler) listAccounts(c *gin.Context) {
	customerIDStr := c.Query("customer_id")
	if customerIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "customer_id query param is required"})
		return
	}

	customerID, err := uuid.Parse(customerIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid customer_id"})
		return
	}

	accounts, err := h.service.ListAccounts(c.Request.Context(), customerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, accounts)
}

func (h *Handler) getAccount(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid account id"})
		return
	}

	account, err := h.service.GetAccount(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "account not found"})
		return
	}

	c.JSON(http.StatusOK, account)
}

func (h *Handler) updateStatus(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid account id"})
		return
	}

	var req struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	account, err := h.service.UpdateStatus(c.Request.Context(), id, domain.AccountStatus(req.Status))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, account)
}

func (h *Handler) createRequest(c *gin.Context) {
	var req struct {
		CustomerID    string `json:"customer_id" binding:"required"`
		RequestedType string `json:"requested_type" binding:"required"`
		Reason        string `json:"reason"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	customerID, err := uuid.Parse(req.CustomerID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid customer_id"})
		return
	}

	request, err := h.service.CreateRequest(
		c.Request.Context(),
		customerID,
		domain.AccountType(req.RequestedType),
		req.Reason,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, request)
}

func (h *Handler) listRequests(c *gin.Context) {
	statusStr := c.Query("status")
	var status *domain.RequestStatus
	if statusStr != "" {
		s := domain.RequestStatus(statusStr)
		status = &s
	}

	requests, err := h.service.GetRequests(c.Request.Context(), status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, requests)
}

func (h *Handler) updateRequestStatus(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request id"})
		return
	}

	var req struct {
		Status      string `json:"status" binding:"required"`
		ProcessedBy string `json:"processed_by" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	processedBy, err := uuid.Parse(req.ProcessedBy)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid processed_by id"})
		return
	}

	request, err := h.service.UpdateRequestStatus(
		c.Request.Context(),
		id,
		domain.RequestStatus(req.Status),
		processedBy,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, request)
}

func (h *Handler) toggleFavorite(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid account id"})
		return
	}

	account, err := h.service.ToggleFavorite(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, account)
}
