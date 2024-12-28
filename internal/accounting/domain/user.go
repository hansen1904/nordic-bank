package domain

import "gorm.io/gorm"

type User struct {
	gorm.Model
	Username string
	Password string
}

// TableName sets the table name to `account.users`
func (User) TableName() string {
	return "account.users"
}
