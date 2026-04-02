$body = @{
    email = "superadmin@safehaul.com"
    password = "SafehaulAdmin2024!"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "https://Safehaul-api-1065403267999.us-central1.run.app/api/v1/auth/login" -Method POST -ContentType "application/json" -Body $body
$response | ConvertTo-Json -Depth 5
