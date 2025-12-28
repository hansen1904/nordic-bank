# Comprehensive Test Suite

This directory contains all automated tests for the Nordic Bank application, covering both frontend and backend components.

## Test Organization

### Frontend Tests (`frontend/customer/src/`)

#### Authentication & Security
- **`DashboardLayout.test.tsx`** - P0 Security: Auth guard tests
- **`LoginContent.test.tsx`** - P1 UX: Login form flexibility tests
- **`RegisterContent.test.tsx`** - P1 Fix: Public registration tests

### Backend Tests (`internal/auth/http/`)

#### API Endpoint Tests
- **`handler_test.go`** - P1 Fix: Registration endpoint tests

## What Each Test Prevents

### P0 Security Vulnerabilities
**Tests**: `DashboardLayout.test.tsx`

**Prevents**:
- ❌ Unauthenticated users accessing dashboard
- ❌ Session bypass after logout
- ❌ Incorrect authentication redirects

**Key Test Cases**:
1. Redirects unauthenticated users to `/login`
2. Shows loading state during auth check
3. Only renders dashboard for authenticated users
4. Blocks access after logout
5. Uses correct locale in redirect URLs

### P1 Login Form Issues
**Tests**: `LoginContent.test.tsx`

**Prevents**:
- ❌ HTML5 email validation blocking usernames
- ❌ Users unable to login with username
- ❌ Backend rejecting non-email formats

**Key Test Cases**:
1. Accepts plain username (e.g., "asdf")
2. Accepts email format
3. Input type is `text` not `email`
4. Proper error handling
5. Locale-aware redirects
6. Form disabling during submission

### P1 Registration Issues
**Tests**: `RegisterContent.test.tsx` (Frontend), `handler_test.go` (Backend)

**Frontend Prevents**:
- ❌ Registration form requiring authentication
- ❌ Invalid username formats being rejected
- ❌ Network errors crashing the app

**Backend Prevents**:
- ❌ Public registration returning 401
- ❌ Customers being able to set their own role
- ❌ Missing validation on registration data

**Key Test Cases**:

*Frontend*:
1. Successfully registers without auth token
2. Validates required fields
3. Handles server errors gracefully
4. Disables form during submission
5. Accepts various username formats
6. Uses correct locale in redirects

*Backend*:
1. Public `/register` endpoint works without auth
2. Forces `customer` role (ignores role in request)
3. Validates email format
4. Requires minimum password length
5. Returns proper HTTP status codes
6. Protected `/register/employee` requires employee auth

## Running Tests

### Frontend Tests
```bash
cd frontend/customer

# Run all tests
npm test

# Run specific test file
npm test DashboardLayout.test.tsx
npm test LoginContent.test.tsx
npm test RegisterContent.test.tsx

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

### Backend Tests
```bash
# Run all Go tests
go test ./...

# Run specific package tests
go test ./internal/auth/http/...

# Run with coverage
go test -cover ./internal/auth/http/...

# Verbose output
go test -v ./internal/auth/http/...

# Run specific test
go test -run TestRegisterCustomer_Success ./internal/auth/http/...
```

## Test Coverage Goals

### Frontend
- **DashboardLayout**: 100% branch coverage for authentication logic
- **LoginContent**: 100% coverage for form submission and validation
- **RegisterContent**: 100% coverage for registration flow and error handling

### Backend
- **handler.go**: 100% coverage for all HTTP endpoints
- **Authentication**: All auth paths tested
- **Validation**: All validation rules tested

## Integration Testing

### Manual Integration Test Checklist
After running unit tests, verify integration:

1. **Registration Flow**:
   - [ ] Navigate to `/en/register`
   - [ ] Fill form with username "testuser123"
   - [ ] Submit without browser errors
   - [ ] Verify 201 response (check Network tab)
   - [ ] Redirected to login page

2. **Login Flow**:
   - [ ] Use username (not email) "testuser123"
   - [ ] Successfully login
   - [ ] Redirected to dashboard

3. **Dashboard Security**:
   - [ ] Try accessing `/dashboard` without login
   - [ ] Should redirect to `/login`
   - [ ] After login, dashboard accessible

4. **Language Switching**:
   - [ ] Switch to Danish in dashboard sidebar
   - [ ] URL changes to `/da/dashboard`
   - [ ] All translations update

## CI/CD Integration

### GitHub Actions (Recommended)
```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd frontend/customer && npm ci
      - run: cd frontend/customer && npm test -- --coverage
      
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-go@v4
      - run: go test -cover ./...
```

## Test Data

### Valid Test Credentials
- Username: `testuser`
- Email: `test@example.com`
- Password: `Password123!`

### Invalid Test Cases
- Username too short: `ab`
- Password too short: `pass`
- Invalid email: `notanemail`

## Debugging Failed Tests

### Frontend Test Failures
1. Check mock implementations
2. Verify translation keys are correct
3. Ensure `useRouter` and `useAuth` mocks are set up
4. Check async/await and `waitFor` usage

### Backend Test Failures
1. Check mock service expectations
2. Verify JSON request/response structure
3. Ensure middleware is properly mocked
4. Check HTTP status codes

## Adding New Tests

When adding new features:
1. Write tests FIRST (TDD)
2. Cover happy path and error cases
3. Test edge cases and validation
4. Ensure mocks are realistic
5. Document what the test prevents

## Related Documentation
- [Test Report](./language_switch_test_report.md) - Initial bug discovery
- [Implementation Plan](./implementation_plan.md) - Feature specifications
- [Walkthrough](./walkthrough.md) - Feature demonstrations
