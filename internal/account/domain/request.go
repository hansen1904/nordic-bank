package domain

import (
	"time"

	"github.com/google/uuid"
)

type RequestStatus string

const (
	RequestStatusPending  RequestStatus = "pending"
	RequestStatusApproved RequestStatus = "approved"
	RequestStatusRejected RequestStatus = "rejected"
)

type AccountRequest struct {
	ID            uuid.UUID     `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	CustomerID    uuid.UUID     `gorm:"type:uuid;not null;index"`
	RequestedType AccountType   `gorm:"type:account.account_type;not null"`
	Status        RequestStatus `gorm:"type:varchar(20);default:'pending'"`
	Reason        string        `gorm:"type:text"` // Optional note from customer

	CreatedAt   time.Time `gorm:"default:CURRENT_TIMESTAMP"`
	UpdatedAt   time.Time `gorm:"default:CURRENT_TIMESTAMP"`
	ProcessedAt *time.Time
	ProcessedBy *uuid.UUID `gorm:"type:uuid"` // Employee who approved/rejected
}

func (AccountRequest) TableName() string {
	return "account.account_requests"
}
