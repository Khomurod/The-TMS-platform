$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3YzUwN2E2ZS05ZmRjLTQ3NDYtYjZmNi03ZGNmZTdmNzAxZGMiLCJjb21wYW55X2lkIjoiYWI2NTcwZTgtNWRmYi00ZDBjLTkzNDItMDM5ZGFmMWVlMjJjIiwicm9sZSI6InN1cGVyX2FkbWluIiwiZXhwIjoxNzc1MTM5OTAyLCJ0eXBlIjoiYWNjZXNzIn0.rTEtx6vBnXURd7GMWx18cyOPX1RFjIrSn0jfjGx-B4k"
$headers = @{ Authorization = "Bearer $token" }
$base = "https://Safehaul-api-1065403267999.us-central1.run.app/api/v1"

Write-Host "=== Dashboard KPIs ===" -ForegroundColor Cyan
(Invoke-RestMethod "$base/dashboard/kpis" -Headers $headers) | ConvertTo-Json

Write-Host "`n=== Loads ===" -ForegroundColor Cyan
(Invoke-RestMethod "$base/loads?page=1&page_size=5" -Headers $headers) | ConvertTo-Json

Write-Host "`n=== Drivers ===" -ForegroundColor Cyan
(Invoke-RestMethod "$base/drivers?page=1&page_size=5" -Headers $headers) | ConvertTo-Json

Write-Host "`n=== Fleet ===" -ForegroundColor Cyan
(Invoke-RestMethod "$base/fleet/trucks?page=1&page_size=5" -Headers $headers) | ConvertTo-Json
