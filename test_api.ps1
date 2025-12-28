$ErrorActionPreference = "Continue"

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Nordic Bank API Test Suite" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

$testResults = @()

# Test 1: Employee Login
Write-Host "[TEST 1] TC-AUTH-001: Employee Login" -ForegroundColor Yellow
$loginBody = @{
    email = "admin@nordicbank.com"
    password = "Admin123!"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8081/api/v1/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    if ($response.access_token -and $response.user_id -and $response.role -eq "employee") {
        Write-Host "✓ PASS: Login successful, token received" -ForegroundColor Green
        $testResults += @{Test="TC-AUTH-001"; Status="PASS"; Details="Employee login successful"}
        $global:employeeToken = $response.access_token
        $global:userId = $response.user_id
    } else {
        Write-Host "✗ FAIL: Invalid response structure" -ForegroundColor Red
        $testResults += @{Test="TC-AUTH-001"; Status="FAIL"; Details="Invalid response"}
    }
} catch {
    Write-Host "✗ FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += @{Test="TC-AUTH-001"; Status="FAIL"; Details=$_.Exception.Message}
}
Write-Host ""

# Test 2: Invalid Credentials
Write-Host "[TEST 2] TC-AUTH-002: Invalid Credentials" -ForegroundColor Yellow
$badLoginBody = @{
    email = "admin@nordicbank.com"
    password = "WrongPassword"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8081/api/v1/auth/login" -Method Post -Body $badLoginBody -ContentType "application/json"
    Write-Host "✗ FAIL: Should have rejected invalid credentials" -ForegroundColor Red
    $testResults += @{Test="TC-AUTH-002"; Status="FAIL"; Details="Accepted invalid credentials"}
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✓ PASS: Correctly rejected invalid credentials (401)" -ForegroundColor Green
        $testResults += @{Test="TC-AUTH-002"; Status="PASS"; Details="401 Unauthorized as expected"}
    } else {
        Write-Host "✗ FAIL: Wrong status code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        $testResults += @{Test="TC-AUTH-002"; Status="FAIL"; Details="Wrong status code"}
    }
}
Write-Host ""

# Test 3: Registration Without Auth
Write-Host "[TEST 3] TC-AUTH-003: Registration Requires Authentication" -ForegroundColor Yellow
$registerBody = @{
    username = "testuser"
    email = "test@example.com"
    password = "Test123!"
    role = "customer"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8081/api/v1/auth/register" -Method Post -Body $registerBody -ContentType "application/json"
    Write-Host "✗ FAIL: Should require authentication" -ForegroundColor Red
    $testResults += @{Test="TC-AUTH-003"; Status="FAIL"; Details="Allowed unauthenticated registration"}
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✓ PASS: Correctly requires authentication (401)" -ForegroundColor Green
        $testResults += @{Test="TC-AUTH-003"; Status="PASS"; Details="401 Unauthorized as expected"}
    } else {
        Write-Host "✗ FAIL: Wrong status code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        $testResults += @{Test="TC-AUTH-003"; Status="FAIL"; Details="Wrong status code"}
    }
}
Write-Host ""

# Test 4: Employee Can Register (if we have token)
if ($global:employeeToken) {
    Write-Host "[TEST 4] TC-AUTH-004: Employee Can Register New User" -ForegroundColor Yellow
    $newUserBody = @{
        username = "testcustomer_$(Get-Random)"
        email = "customer_$(Get-Random)@test.com"
        password = "Customer123!"
        role = "customer"
    } | ConvertTo-Json

    try {
        $headers = @{
            "Authorization" = "Bearer $($global:employeeToken)"
        }
        $response = Invoke-RestMethod -Uri "http://localhost:8081/api/v1/auth/register" -Method Post -Body $newUserBody -ContentType "application/json" -Headers $headers
        if ($response.id) {
            Write-Host "✓ PASS: Employee successfully registered new user" -ForegroundColor Green
            $testResults += @{Test="TC-AUTH-004"; Status="PASS"; Details="User created with ID: $($response.id)"}
            $global:newCustomerUserId = $response.id
        } else {
            Write-Host "✗ FAIL: No user ID returned" -ForegroundColor Red
            $testResults += @{Test="TC-AUTH-004"; Status="FAIL"; Details="No user ID in response"}
        }
    } catch {
        Write-Host "✗ FAIL: $($_.Exception.Message)" -ForegroundColor Red
        $testResults += @{Test="TC-AUTH-004"; Status="FAIL"; Details=$_.Exception.Message}
    }
    Write-Host ""
}

# Test 5: CORS Headers
Write-Host "[TEST 5] TC-AUTH-005: CORS Headers Present" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8081/api/v1/auth/login" -Method Options
    $corsHeader = $response.Headers["Access-Control-Allow-Origin"]
    if ($corsHeader) {
        Write-Host "✓ PASS: CORS headers present: $corsHeader" -ForegroundColor Green
        $testResults += @{Test="TC-AUTH-005"; Status="PASS"; Details="CORS header: $corsHeader"}
    } else {
        Write-Host "✗ FAIL: No CORS headers found" -ForegroundColor Red
        $testResults += @{Test="TC-AUTH-005"; Status="FAIL"; Details="Missing CORS headers"}
    }
} catch {
    Write-Host "✗ FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += @{Test="TC-AUTH-005"; Status="FAIL"; Details=$_.Exception.Message}
}
Write-Host ""

# Test 6: Create Customer Profile (if we have token and new user)
if ($global:employeeToken -and $global:newCustomerUserId) {
    Write-Host "[TEST 6] TC-CUST-001: Create Customer Profile" -ForegroundColor Yellow
    $customerBody = @{
        user_id = $global:newCustomerUserId
        first_name = "John"
        last_name = "Doe"
        email = "john.doe@test.com"
        phone = "+4512345678"
        date_of_birth = "1990-01-01"
        address = @{
            street = "Test Street 123"
            city = "Copenhagen"
            postal_code = "1000"
            country = "Denmark"
        }
    } | ConvertTo-Json -Depth 3

    try {
        $headers = @{
            "Authorization" = "Bearer $($global:employeeToken)"
        }
        $response = Invoke-RestMethod -Uri "http://localhost:8082/api/v1/customers/" -Method Post -Body $customerBody -ContentType "application/json" -Headers $headers
        if ($response.id) {
            Write-Host "✓ PASS: Customer profile created with ID: $($response.id)" -ForegroundColor Green
            $testResults += @{Test="TC-CUST-001"; Status="PASS"; Details="Customer ID: $($response.id)"}
            $global:customerId = $response.id
        } else {
            Write-Host "✗ FAIL: No customer ID returned" -ForegroundColor Red
            $testResults += @{Test="TC-CUST-001"; Status="FAIL"; Details="No customer ID"}
        }
    } catch {
        Write-Host "✗ FAIL: $($_.Exception.Message)" -ForegroundColor Red
        $testResults += @{Test="TC-CUST-001"; Status="FAIL"; Details=$_.Exception.Message}
    }
    Write-Host ""
}

# Test 7: Unauthorized Customer Creation
Write-Host "[TEST 7] TC-CUST-002: Unauthorized Customer Creation" -ForegroundColor Yellow
$customerBody = @{
    user_id = "00000000-0000-0000-0000-000000000000"
    first_name = "Unauthorized"
    last_name = "User"
    email = "unauth@test.com"
    phone = "+4500000000"
    date_of_birth = "1990-01-01"
    address = @{
        street = "Test"
        city = "Test"
        postal_code = "0000"
        country = "Denmark"
    }
} | ConvertTo-Json -Depth 3

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8082/api/v1/customers/" -Method Post -Body $customerBody -ContentType "application/json"
    Write-Host "✗ FAIL: Should require authentication" -ForegroundColor Red
    $testResults += @{Test="TC-CUST-002"; Status="FAIL"; Details="Allowed unauthenticated creation"}
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✓ PASS: Correctly requires authentication (401)" -ForegroundColor Green
        $testResults += @{Test="TC-CUST-002"; Status="PASS"; Details="401 Unauthorized as expected"}
    } else {
        Write-Host "✗ FAIL: Wrong status code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        $testResults += @{Test="TC-CUST-002"; Status="FAIL"; Details="Wrong status code"}
    }
}
Write-Host ""

# Summary
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
$passed = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
$failed = ($testResults | Where-Object { $_.Status -eq "FAIL" }).Count
$total = $testResults.Count

Write-Host "Total Tests: $total" -ForegroundColor White
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor Red
Write-Host ""

# Export results
$testResults | ConvertTo-Json | Out-File "test_results.json"
Write-Host "Results exported to test_results.json" -ForegroundColor Cyan
