$ErrorActionPreference = "Stop"
$API_URL = "https://Safehaul-api-1065403267999.us-central1.run.app/api/v1"
$lb = @{ email="admin@testcompany.com"; password="SecurePass123!" } | ConvertTo-Json
$lr = Invoke-RestMethod -Uri "$API_URL/auth/login" -Method Post -Body $lb -ContentType "application/json"
$h = @{ Authorization = "Bearer $($lr.access_token)" }

Write-Host "Getting drivers..."
$drivers = Invoke-RestMethod -Uri "$API_URL/drivers" -Method Get -Headers $h
$payDrivers = $drivers.items | Where-Object { $_.pay_rate_type -ne $null -and $_.pay_rate_type -ne "" }

Write-Host "Getting delivered/billed/paid loads..."
$loads = Invoke-RestMethod -Uri "$API_URL/loads?page_size=100" -Method Get -Headers $h
$needsDriver = $loads.items | Where-Object { $_.status -in @("delivered","billed","paid") -and ($_.driver_id -eq $null -or $_.driver_id -eq "") }

$idx = 0
$driverLoadMap = @{}

foreach ($ld in $needsDriver) {
    if ($payDrivers.Count -eq 0) { break }
    
    $did = $payDrivers[$idx % $payDrivers.Count].id
    $body = @{ driver_id = $did } | ConvertTo-Json
    try {
        Invoke-RestMethod -Uri "$API_URL/loads/$($ld.id)" -Method Put -Body $body -Headers $h -ContentType "application/json" | Out-Null
        Write-Host "Assigned driver $did to $($ld.load_number)"
        $driverLoadMap[$did] = $true
    } catch {
        Write-Host "Assign failed for $($ld.load_number): $_"
    }
    $idx++
}

Write-Host "`nGenerating Settlements..."
foreach ($did in $driverLoadMap.Keys) {
    $sb = @{ driver_id=$did; period_start="2026-03-01"; period_end="2026-03-31" } | ConvertTo-Json
    try {
        $stl = Invoke-RestMethod -Uri "$API_URL/accounting/settlements/generate" -Method Post -Body $sb -Headers $h -ContentType "application/json"
        Write-Host "Settlement $($stl.settlement_number) for driver $did Net pay: $($stl.net_pay)"
    } catch {
        $errStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errStream)
        $errBody = $reader.ReadToEnd()
        Write-Host "Settlement failed for $did : $errBody"
    }
}
