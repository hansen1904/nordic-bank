package domain

import (
	"time"

	"github.com/google/uuid"
)

type UserRole string

const (
	RoleCustomer UserRole = "customer"
	RoleEmployee UserRole = "employee"
	RoleAdmin    UserRole = "admin"
)

type UserStatus string

const (
	StatusActive    UserStatus = "active"
	StatusInactive  UserStatus = "inactive"
	StatusSuspended UserStatus = "suspended"
	StatusLocked    UserStatus = "locked"
	StatusClosed    UserStatus = "closed"
)

type User struct {
	ID                         uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	Username                   string    `gorm:"uniqueIndex;not null;size:50"`
	Email                      string    `gorm:"uniqueIndex;not null;size:255"`
	EmailVerified              bool      `gorm:"default:false"`
	EmailVerificationToken     string    `gorm:"size:255"`
	EmailVerificationExpiresAt *time.Time

	PasswordHash        string `gorm:"not null;size:255"`
	PasswordChangedAt   *time.Time
	FailedLoginAttempts int `gorm:"default:0"`
	AccountLockedUntil  *time.Time

	Role   UserRole   `gorm:"type:auth.user_role;not null"`
	Status UserStatus `gorm:"type:auth.user_status;default:'active'"`

	TwoFactorEnabled     bool     `gorm:"default:false"`
	TwoFactorSecret      string   `gorm:"size:255"`
	TwoFactorBackupCodes []string `gorm:"type:text[]"`

	CreatedAt           time.Time `gorm:"default:CURRENT_TIMESTAMP"`
	UpdatedAt           time.Time `gorm:"default:CURRENT_TIMESTAMP"`
	LastLoginAt         *time.Time
	LastPasswordResetAt *time.Time
}

// TableName overrides the table name used by User to `auth.users`
func (User) TableName() string {
	return "auth.users"
}
