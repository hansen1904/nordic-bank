package domain

import (
	"time"

	"github.com/google/uuid"
)

type KycStatus string

const (
	KycStatusPending  KycStatus = "pending"
	KycStatusInReview KycStatus = "in_review"
	KycStatusVerified KycStatus = "verified"
	KycStatusRejected KycStatus = "rejected"
	KycStatusExpired  KycStatus = "expired"
)

type CustomerStatus string

const (
	CustomerStatusActive    CustomerStatus = "active"
	CustomerStatusInactive  CustomerStatus = "inactive"
	CustomerStatusSuspended CustomerStatus = "suspended"
	CustomerStatusClosed    CustomerStatus = "closed"
)

type Address struct {
	Street     string
	City       string
	PostalCode string
	Country    string
}

type Customer struct {
	ID                    uuid.UUID      `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	UserID                uuid.UUID      `gorm:"type:uuid;uniqueIndex;not null"`
	RelationshipManagerID uuid.UUID      `gorm:"type:uuid;not null"`
	FirstName             string         `gorm:"not null;size:100"`
	MiddleName            string         `gorm:"size:100"`
	LastName              string         `gorm:"not null;size:100"`
	DateOfBirth           time.Time      `gorm:"not null"`
	Phone                 string         `gorm:"not null;size:20"`
	Email                 string         `gorm:"not null;size:255"`
	Status                CustomerStatus `gorm:"type:customer.customer_status;default:'active'"`

	// Address
	AddressStreet     string `gorm:"size:255"`
	AddressCity       string `gorm:"size:100"`
	AddressPostalCode string `gorm:"size:20"`
	AddressCountry    string `gorm:"size:2"` // ISO 3166-1 alpha-2

	// KYC
	KycStatus     KycStatus `gorm:"type:customer.kyc_status;default:'pending'"`
	KycVerifiedAt *time.Time
	KycNotes      string `gorm:"type:text"`

	CreatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP"`
	UpdatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP"`
}

func (Customer) TableName() string {
	return "customer.customers"
}
