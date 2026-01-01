package application

import (
	"context"
	"errors"
	"time"

	"nordic-bank/internal/auth/domain"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	userRepo    domain.UserRepository
	sessionRepo domain.SessionRepository
	jwtSecret   []byte
}

func NewAuthService(userRepo domain.UserRepository, sessionRepo domain.SessionRepository, jwtSecret string) *AuthService {
	return &AuthService{
		userRepo:    userRepo,
		sessionRepo: sessionRepo,
		jwtSecret:   []byte(jwtSecret),
	}
}

// Register creates a new user account
func (s *AuthService) Register(ctx context.Context, username, email, password string, role domain.UserRole) (*domain.User, error) {
	// Check if user exists
	if _, err := s.userRepo.GetByEmail(ctx, email); err == nil {
		return nil, errors.New("email already registered")
	}
	if _, err := s.userRepo.GetByUsername(ctx, username); err == nil {
		return nil, errors.New("username already taken")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &domain.User{
		Username:     username,
		Email:        email,
		PasswordHash: string(hashedPassword),
		Role:         role,
		Status:       domain.StatusActive,
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, err
	}

	return user, nil
}

// SeedDefaultEmployee ensures at least one employee exists in the system
func (s *AuthService) SeedDefaultEmployee(ctx context.Context, username, email, password string) error {
	_, err := s.userRepo.GetByEmail(ctx, email)
	if err == nil {
		// User already exists
		return nil
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	user := &domain.User{
		Username:     username,
		Email:        email,
		PasswordHash: string(hashedPassword),
		Role:         domain.RoleEmployee,
		Status:       domain.StatusActive,
	}

	return s.userRepo.Create(ctx, user)
}

// Login authenticates a user and returns user and tokens
func (s *AuthService) Login(ctx context.Context, identifier, password, ipAddress, userAgent string) (*domain.User, string, string, error) {
	user, err := s.userRepo.GetByEmailOrUsername(ctx, identifier)
	if err != nil {
		// Generic error message as requested
		return nil, "", "", errors.New("Your username or password is incorrect, please try again")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		// Update failed attempts (logic omitted for brevity)
		return nil, "", "", errors.New("Your username or password is incorrect, please try again")
	}

	if user.Status != domain.StatusActive {
		return nil, "", "", errors.New("account is not active")
	}

	// Generate Tokens
	accessToken, err := s.generateToken(user, 15*time.Minute)
	if err != nil {
		return nil, "", "", err
	}
	refreshToken, err := s.generateToken(user, 7*24*time.Hour)
	if err != nil {
		return nil, "", "", err
	}

	// Create Session
	session := &domain.Session{
		UserID:                user.ID,
		AccessToken:           accessToken,
		RefreshToken:          refreshToken,
		AccessTokenExpiresAt:  time.Now().Add(15 * time.Minute),
		RefreshTokenExpiresAt: time.Now().Add(7 * 24 * time.Hour),
		IPAddress:             ipAddress,
		UserAgent:             userAgent,
	}

	if err := s.sessionRepo.Create(ctx, session); err != nil {
		return nil, "", "", err
	}

	// Update LastLogin
	now := time.Now()
	user.LastLoginAt = &now
	user.FailedLoginAttempts = 0
	_ = s.userRepo.Update(ctx, user)

	return user, accessToken, refreshToken, nil
}

// VerifyJWT validates a token and returns claims
func (s *AuthService) VerifyJWT(tokenString string) (*CustomClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &CustomClaims{}, func(token *jwt.Token) (interface{}, error) {
		return s.jwtSecret, nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*CustomClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid token")
}

func (s *AuthService) generateToken(user *domain.User, duration time.Duration) (string, error) {
	claims := CustomClaims{
		UserID:   user.ID.String(),
		Username: user.Username,
		Email:    user.Email,
		Role:     user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(duration)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "nordic-bank-auth",
			Subject:   user.ID.String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.jwtSecret)
}

type CustomClaims struct {
	UserID     string          `json:"user_id"`
	Username   string          `json:"username"`
	Email      string          `json:"email"`
	Role       domain.UserRole `json:"role"`
	CustomerID string          `json:"customer_id,omitempty"`
	jwt.RegisteredClaims
}

// UserPreferences represents user preference settings
type UserPreferences struct {
	Theme                string `json:"theme"`
	Language             string `json:"language"`
	NotificationsEnabled bool   `json:"notifications_enabled"`
	EmailNotifications   bool   `json:"email_notifications"`
}

// GetPreferences retrieves user preferences by user ID
func (s *AuthService) GetPreferences(ctx context.Context, userID string) (*UserPreferences, error) {
	id, err := uuid.Parse(userID)
	if err != nil {
		return nil, errors.New("invalid user id")
	}

	user, err := s.userRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	return &UserPreferences{
		Theme:                user.PreferredTheme,
		Language:             user.PreferredLanguage,
		NotificationsEnabled: user.NotificationsEnabled,
		EmailNotifications:   user.EmailNotifications,
	}, nil
}

// GetUserByID retrieves a user by their ID
func (s *AuthService) GetUserByID(ctx context.Context, userID string) (*domain.User, error) {
	id, err := uuid.Parse(userID)
	if err != nil {
		return nil, errors.New("invalid user id")
	}

	user, err := s.userRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	return user, nil
}

// ListUsers retrieves users optionally filtered by role
func (s *AuthService) ListUsers(ctx context.Context, role *domain.UserRole) ([]domain.User, error) {
	if role != nil {
		return s.userRepo.ListByRole(ctx, *role)
	}
	// If no role specified, we could list all, but for now let's just return empty or implement ListAll if needed
	// For this specific requirement, we only need filtering by role
	return nil, errors.New("role filter is required")
}

// UpdatePreferences updates user preferences
func (s *AuthService) UpdatePreferences(ctx context.Context, userID string, prefs *UserPreferences) error {
	id, err := uuid.Parse(userID)
	if err != nil {
		return errors.New("invalid user id")
	}

	user, err := s.userRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	user.PreferredTheme = prefs.Theme
	user.PreferredLanguage = prefs.Language
	user.NotificationsEnabled = prefs.NotificationsEnabled
	user.EmailNotifications = prefs.EmailNotifications

	return s.userRepo.Update(ctx, user)
}
