package http

import (
	"net/http"

	"nordic-bank/internal/transaction/application"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type Handler struct {
	service *application.TransactionService
}

func NewHandler(service *application.TransactionService) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterRoutes(router *gin.Engine) {
	tx := router.Group("/api/v1/transactions")
	{
		tx.POST("/transfer", h.createTransfer)
		tx.GET("/:id", h.getTransaction)
		tx.GET("/account/:accountId", h.listTransactions)
	}
}

type createTransferRequest struct {
	SourceAccountID      string `json:"source_account_id" binding:"required"`
	DestinationAccountID string `json:"destination_account_id" binding:"required"`
	Amount               int64  `json:"amount" binding:"required,gt=0"`
	Currency             string `json:"currency" binding:"required"`
	Reference            string `json:"reference"`
	Description          string `json:"description"`
	IdempotencyKey       string `json:"idempotency_key" binding:"required"`
}

func (h *Handler) createTransfer(c *gin.Context) {
	var req createTransferRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	srcID, err := uuid.Parse(req.SourceAccountID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid source_account_id"})
		return
	}
	dstID, err := uuid.Parse(req.DestinationAccountID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid destination_account_id"})
		return
	}

	tx, err := h.service.CreateTransfer(c.Request.Context(), srcID, dstID, req.Amount, req.Currency, req.Reference, req.Description, req.IdempotencyKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, tx)
}

func (h *Handler) getTransaction(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid transaction id"})
		return
	}

	tx, err := h.service.GetTransaction(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "transaction not found"})
		return
	}

	c.JSON(http.StatusOK, tx)
}

func (h *Handler) listTransactions(c *gin.Context) {
	accIDStr := c.Param("accountId")
	accID, err := uuid.Parse(accIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid account id"})
		return
	}

	// Simple pagination for now
	txs, total, err := h.service.ListTransactions(c.Request.Context(), accID, 1, 50)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"transactions": txs,
		"total":        total,
	})
}
