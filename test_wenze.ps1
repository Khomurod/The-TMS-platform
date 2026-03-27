$ErrorActionPreference = "Stop"

$API_URL = "https://kinetic-api-1065403267999.us-central1.run.app/api/v1"

Write-Host "1. Logging in as Admin (testcompany.com)..."
$loginBody = @{
    email = "admin@testcompany.com"
    password = "SecurePass123!"
} | ConvertTo-Json -Depth 1

Write-Host "Sending login request..."
$loginResponse = Invoke-RestMethod -Uri "$API_URL/auth/login" -Method Post -Body $loginBody -ContentType 'application/json'

$rawToken = $loginResponse.access_token
Write-Host "Authentication successful! Token begins with: $($rawToken.Substring(0, 10))..."

# Explicitly Typed Dictionary to avoid PowerShell Hashtable Header stripping bugs
$headers = New-Object "System.Collections.Generic.Dictionary[[String],[String]]"
$headers.Add("Authorization", "Bearer $rawToken")
$headers.Add("Accept", "application/json")

Write-Host "2. Creating Test Driver..."
$driverBody = @{
    first_name = "Speedy"
    last_name = "Gonzales"
    phone = "555-0199"
    email = "speedy-$([Guid]::NewGuid().ToString().Substring(0,5))@wenze.com"
    license_number = "CDL-$([int](Get-Random -Minimum 1000 -Maximum 9999))"
    license_state = "TX"
    license_expiry = "2028-12-31"
    employment_type = "company_w2"
    status = "active"
} | ConvertTo-Json

$driverResponse = Invoke-RestMethod -Uri "$API_URL/drivers" -Method Post -Body $driverBody -Headers $headers -ContentType "application/json"
Write-Host "Driver created: $($driverResponse.id)"

Write-Host "3. Creating Test Truck..."
$truckBody = @{
    unit_number = "T-$([int](Get-Random -Minimum 10 -Maximum 999))"
    make = "Freightliner"
    model = "Cascadia"
    year = 2024
    vin = "1FUJA$([int](Get-Random -Minimum 100000 -Maximum 999999))"
    plate_number = "TX-$([int](Get-Random -Minimum 10 -Maximum 99))A1"
    plate_state = "TX"
    status = "active"
} | ConvertTo-Json

$truckResponse = Invoke-RestMethod -Uri "$API_URL/fleet/trucks" -Method Post -Body $truckBody -Headers $headers -ContentType "application/json"
Write-Host "Truck created: $($truckResponse.id)"

Write-Host "4. Creating Test Trailer..."
$trailerBody = @{
    unit_number = "TRL-$([int](Get-Random -Minimum 10 -Maximum 999))"
    type = "dry_van"
    make = "Utility"
    year = 2025
    vin = "1UYJ$([int](Get-Random -Minimum 1000 -Maximum 9999))X"
    plate_number = "TR-$([int](Get-Random -Minimum 10 -Maximum 99))X"
    plate_state = "TX"
    status = "active"
} | ConvertTo-Json

$trailerResponse = Invoke-RestMethod -Uri "$API_URL/fleet/trailers" -Method Post -Body $trailerBody -Headers $headers -ContentType "application/json"
Write-Host "Trailer created: $($trailerResponse.id)"

Write-Host "5. Creating Test Load..."
$loadBody = @{
    reference_number = "L-$([int](Get-Random -Minimum 1000 -Maximum 9999))"
    status = "available"
    base_rate = 1200.50
    total_miles = 200
    notes = "Electronics shipment"
    stops = @(
        @{ stop_type = "pickup"; stop_sequence = 1; city = "Dallas"; state = "TX" },
        @{ stop_type = "delivery"; stop_sequence = 2; city = "Austin"; state = "TX" }
    )
    accessorials = @()
} | ConvertTo-Json -Depth 4

$loadResponse = Invoke-RestMethod -Uri "$API_URL/loads" -Method Post -Body $loadBody -Headers $headers -ContentType "application/json"
Write-Host "Load created: $($loadResponse.id)"

Write-Host "6. Verifying Dashboard Aggregation Stats..."
$dashboardResponse = Invoke-RestMethod -Uri "$API_URL/dashboard/stats" -Method Get -Headers $headers -ContentType "application/json"

Write-Host "`n--- Verification Results from Backend ---"
Write-Host "Active Drivers: $($dashboardResponse.fleet.active_drivers)"
Write-Host "Active Trucks: $($dashboardResponse.fleet.active_trucks)"
Write-Host "Planned Loads: $($dashboardResponse.loads.planned)"
Write-Host "End-to-End Test Completed Successfully!"
