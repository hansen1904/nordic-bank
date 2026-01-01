package http

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"nordic-bank/internal/auth/application"
	"nordic-bank/internal/auth/domain"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// Mock AuthService
type MockAuthService struct {
	mock.Mock
}

func (m *MockAuthService) Register(ctx context.Context, username, email, password string, role domain.UserRole) (*domain.User, error) {
	args := m.Called(ctx, username, email, password, role)
	if user := args.Get(0); user != nil {
		return user.(*domain.User), args.Error(1)
	}
	return nil, args.Error(1)
}

func (m *MockAuthService) Login(ctx context.Context, email, password, ipAddress, userAgent string) (*domain.User, string, string, error) {
	args := m.Called(ctx, email, password, ipAddress, userAgent)
	if user := args.Get(0); user != nil {
		return user.(*domain.User), args.String(1), args.String(2), args.Error(3)
	}
	return nil, "", "", args.Error(3)
}

func (m *MockAuthService) SeedDefaultEmployee(ctx context.Context, username, email, password string) error {
	args := m.Called(ctx, username, email, password)
	return args.Error(0)
}

func (m *MockAuthService) GetPreferences(ctx context.Context, userID string) (*application.UserPreferences, error) {
	args := m.Called(ctx, userID)
	if prefs := args.Get(0); prefs != nil {
		return prefs.(*application.UserPreferences), args.Error(1)
	}
	return nil, args.Error(1)
}

func (m *MockAuthService) GetUserByID(ctx context.Context, userID string) (*domain.User, error) {
	args := m.Called(ctx, userID)
	if user := args.Get(0); user != nil {
		return user.(*domain.User), args.Error(1)
	}
	return nil, args.Error(1)
}

func (m *MockAuthService) UpdatePreferences(ctx context.Context, userID string, prefs *application.UserPreferences) error {
	args := m.Called(ctx, userID, prefs)
	return args.Error(0)
}

func setupTestRouter(service *MockAuthService) *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.Default()
	handler := NewHandler(service, "test-secret")
	handler.RegisterRoutes(router)
	return router
}

// Test P1 FIX: Public Customer Registration
func TestRegisterCustomer_Success(t *testing.T) {
	// ARRANGE
	mockService := new(MockAuthService)
	router := setupTestRouter(mockService)

	expectedUser := &domain.User{
		ID:       uuid.MustParse("11111111-1111-1111-1111-111111111111"),
		Username: "testuser",
		Email:    "test@example.com",
		Role:     domain.RoleCustomer,
	}

	mockService.On("Register", mock.Anything, "testuser", "test@example.com", "Password123!", domain.RoleCustomer).
		Return(expectedUser, nil)

	reqBody := map[string]interface{}{
		"username":  "testuser",
		"email":     "test@example.com",
		"password":  "Password123!",
		"firstName": "Test",
		"lastName":  "User",
	}
	jsonBody, _ := json.Marshal(reqBody)

	// ACT
	req, _ := http.NewRequest("POST", "/api/v1/auth/register", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// ASSERT
	assert.Equal(t, http.StatusCreated, w.Code, "Should return 201 Created")

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)

	assert.Equal(t, "11111111-1111-1111-1111-111111111111", response["id"])
	assert.Equal(t, "testuser", response["username"])
	assert.Equal(t, "test@example.com", response["email"])

	mockService.AssertExpectations(t)
}

func TestRegisterCustomer_NoAuthRequired(t *testing.T) {
	// ARRANGE - Test that no authentication is required
	mockService := new(MockAuthService)
	router := setupTestRouter(mockService)

	expectedUser := &domain.User{
		ID:       uuid.MustParse("22222222-2222-2222-2222-222222222222"),
		Username: "newuser",
		Email:    "new@example.com",
		Role:     domain.RoleCustomer,
	}

	mockService.On("Register", mock.Anything, "newuser", "new@example.com", "SecurePass123!", domain.RoleCustomer).
		Return(expectedUser, nil)

	reqBody := map[string]interface{}{
		"username": "newuser",
		"email":    "new@example.com",
		"password": "SecurePass123!",
	}
	jsonBody, _ := json.Marshal(reqBody)

	// ACT - Send request WITHOUT Authorization header
	req, _ := http.NewRequest("POST", "/api/v1/auth/register", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	// Note: NO Authorization header
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// ASSERT - Should succeed without auth
	assert.Equal(t, http.StatusCreated, w.Code, "Public registration should not require authentication")
	mockService.AssertExpectations(t)
}

func TestRegisterCustomer_ForcesCustomerRole(t *testing.T) {
	// ARRANGE - Test that role is forced to customer
	mockService := new(MockAuthService)
	router := setupTestRouter(mockService)

	expectedUser := &domain.User{
		ID:       uuid.MustParse("33333333-3333-3333-3333-333333333333"),
		Username: "roletest",
		Email:    "role@example.com",
		Role:     domain.RoleCustomer,
	}

	// Expect RoleCustomer, not whatever the user sends
	mockService.On("Register", mock.Anything, "roletest", "role@example.com", "Pass123!", domain.RoleCustomer).
		Return(expectedUser, nil)

	reqBody := map[string]interface{}{
		"username": "roletest",
		"email":    "role@example.com",
		"password": "Pass123!",
		"role":     "employee", // Try to register as employee (should be ignored)
	}
	jsonBody, _ := json.Marshal(reqBody)

	// ACT
	req, _ := http.NewRequest("POST", "/api/v1/auth/register", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// ASSERT - Should force customer role
	assert.Equal(t, http.StatusCreated, w.Code)
	mockService.AssertExpectations(t) // Will fail if RoleEmployee was used
}

func TestRegisterCustomer_ValidationErrors(t *testing.T) {
	mockService := new(MockAuthService)
	router := setupTestRouter(mockService)

	tests := []struct {
		name           string
		requestBody    map[string]interface{}
		expectedStatus int
	}{
		{
			name: "Missing username",
			requestBody: map[string]interface{}{
				"email":    "test@example.com",
				"password": "Password123!",
			},
			expectedStatus: http.StatusBadRequest,
		},
		{
			name: "Missing email",
			requestBody: map[string]interface{}{
				"username": "testuser",
				"password": "Password123!",
			},
			expectedStatus: http.StatusBadRequest,
		},
		{
			name: "Invalid email format",
			requestBody: map[string]interface{}{
				"username": "testuser",
				"email":    "not-an-email",
				"password": "Password123!",
			},
			expectedStatus: http.StatusBadRequest,
		},
		{
			name: "Password too short",
			requestBody: map[string]interface{}{
				"username": "testuser",
				"email":    "test@example.com",
				"password": "short",
			},
			expectedStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			jsonBody, _ := json.Marshal(tt.requestBody)
			req, _ := http.NewRequest("POST", "/api/v1/auth/register", bytes.NewBuffer(jsonBody))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code, tt.name)
		})
	}
}

// Test P1 FIX: Login accepts both email and username (backend perspective)
func TestLogin_AcceptsEmailOrUsername(t *testing.T) {
	mockService := new(MockAuthService)
	router := setupTestRouter(mockService)

	expectedUser := &domain.User{
		ID:       uuid.MustParse("11111111-1111-1111-1111-111111111111"),
		Username: "testuser",
		Email:    "test@example.com",
		Role:     domain.RoleCustomer,
	}

	tests := []struct {
		name        string
		emailOrUser string
		description string
	}{
		{
			name:        "Login with email format",
			emailOrUser: "test@example.com",
			description: "Should accept email format",
		},
		{
			name:        "Login with username (looks like email)",
			emailOrUser: "asdf@asdf.com",
			description: "Should work even with non-existent email format",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockService.On("Login", mock.Anything, tt.emailOrUser, "password123", mock.Anything, mock.Anything).
				Return(expectedUser, "access-token", "refresh-token", nil).
				Once()

			reqBody := map[string]interface{}{
				"email":    tt.emailOrUser,
				"password": "password123",
			}
			jsonBody, _ := json.Marshal(reqBody)

			req, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(jsonBody))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusOK, w.Code, tt.description)
		})
	}

	mockService.AssertExpectations(t)
}

// Test route registration
func TestRouteRegistration(t *testing.T) {
	mockService := new(MockAuthService)
	router := setupTestRouter(mockService)

	routes := router.Routes()

	// Find our routes
	var foundPublicRegister, foundEmployeeRegister, foundLogin bool

	for _, route := range routes {
		switch route.Path {
		case "/api/v1/auth/register":
			foundPublicRegister = true
			assert.Equal(t, "POST", route.Method, "Public register should be POST")
		case "/api/v1/auth/register/employee":
			foundEmployeeRegister = true
			assert.Equal(t, "POST", route.Method, "Employee register should be POST")
		case "/api/v1/auth/login":
			foundLogin = true
			assert.Equal(t, "POST", route.Method, "Login should be POST")
		}
	}

	assert.True(t, foundPublicRegister, "Public registration route should exist")
	assert.True(t, foundEmployeeRegister, "Employee registration route should exist")
	assert.True(t, foundLogin, "Login route should exist")
}
