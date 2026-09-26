$baseUrl = "http://127.0.0.1:8000/api"

Write-Host "Registering admin..."
$regBody = @{
    email = "admin_test2@test.com"
    password = "password123"
    full_name = "Test Admin"
    role = "SUPER_ADMIN"
} | ConvertTo-Json
try {
    Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $regBody -ContentType "application/json"
} catch {}

Write-Host "Logging in..."
$loginBody = @{
    email = "admin_test2@test.com"
    password = "password123"
} | ConvertTo-Json
$loginResp = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginResp.access_token

$headers = @{
    Authorization = "Bearer $token"
}

Write-Host "`n--- TEST 1: CREATE ---"
$studentBody = @{
    full_name = "Test Student"
    email = "student_test2@test.com"
    mobile_number = "9876543210"
    date_of_birth = "2010-01-01T00:00:00Z"
    gender = "Male"
    address = "123 Test Street"
    parent_name = "Parent Name"
    parent_mobile = "9876543211"
    course = "Maths"
    batch = "Morning"
    academic_year = "2023-2024"
} | ConvertTo-Json

try {
    $createResp = Invoke-RestMethod -Uri "$baseUrl/students" -Method Post -Body $studentBody -Headers $headers -ContentType "application/json"
    $studentId = $createResp.id
    Write-Host "Created student with ID: $studentId"
} catch {
    Write-Host "Create failed: $_"
    exit
}

Write-Host "`n--- TEST 2: READ ---"
$readResp = Invoke-RestMethod -Uri "$baseUrl/students" -Method Get -Headers $headers
$found = $readResp | Where-Object { $_.id -eq $studentId }
if ($found) {
    Write-Host "Student found in DB: $($found.full_name)"
} else {
    Write-Host "Student not found in DB!"
}

Write-Host "`n--- TEST 3: UPDATE ---"
$updateBody = @{
    full_name = "Test Student Updated"
} | ConvertTo-Json
try {
    $updateResp = Invoke-RestMethod -Uri "$baseUrl/students/$studentId" -Method Put -Body $updateBody -Headers $headers -ContentType "application/json"
    Write-Host "Update response name: $($updateResp.full_name)"
} catch {
    Write-Host "Update failed: $_"
}

$readResp2 = Invoke-RestMethod -Uri "$baseUrl/students" -Method Get -Headers $headers
$found2 = $readResp2 | Where-Object { $_.id -eq $studentId }
Write-Host "Student name after GET: $($found2.full_name)"

Write-Host "`n--- TEST 4: DELETE ---"
try {
    Invoke-RestMethod -Uri "$baseUrl/students/$studentId" -Method Delete -Headers $headers
    Write-Host "Delete command sent."
} catch {
    Write-Host "Delete failed: $_"
}

$readResp3 = Invoke-RestMethod -Uri "$baseUrl/students" -Method Get -Headers $headers
$found3 = $readResp3 | Where-Object { $_.id -eq $studentId }
if ($found3) {
    Write-Host "ERROR: Student still exists!"
} else {
    Write-Host "Student successfully deleted."
}
