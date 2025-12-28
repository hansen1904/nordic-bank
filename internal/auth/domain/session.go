package domain

import (
	"time"

	"github.com/google/uuid"
)

type Session struct {
	ID     uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	UserID uuid.UUID `gorm:"type:uuid;not null;index"`

	AccessToken           string    `gorm:"not null;uniqueIndex;size:500"`
	RefreshToken          string    `gorm:"not null;uniqueIndex;size:500"`
	AccessTokenExpiresAt  time.Time `gorm:"not null"`
	RefreshTokenExpiresAt time.Time `gorm:"not null"`

	IPAddress         string `gorm:"type:inet;not null"`
	UserAgent         string
	DeviceFingerprint string `gorm:"size:255"`
	DeviceType        string `gorm:"size:20"`
	DeviceOS          string `gorm:"column:device_os;size:50"`
	DeviceBrowser     string `gorm:"size:50"`

	CountryCode string `gorm:"size:2"`
	City        string `gorm:"size:100"`

	CreatedAt        time.Time `gorm:"default:CURRENT_TIMESTAMP"`
	LastActivityAt   time.Time `gorm:"default:CURRENT_TIMESTAMP"`
	RevokedAt        *time.Time
	RevocationReason string `gorm:"size:100"`
}

// TableName overrides the table name used by Session to `auth.sessions`
func (Session) TableName() string {
	return "auth.sessions"
}
