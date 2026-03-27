# Kinetic TMS - Full Data Population Script
# Populates all modules: Company Settings, Drivers, Fleet, Loads (with state machine), Settlements, Invoices

$ErrorActionPreference = "Stop"
$API_URL = "https://kinetic-api-1065403267999.us-central1.run.app/api/v1"

# ---------- 1. AUTHENTICATE ----------
Write-Host "1. Authenticating..."
$loginBody = @{ email = "admin@testcompany.com"; password = "SecurePass123!" } | ConvertTo-Json
$loginResponse = Invoke-RestMethod -Uri "$API_URL/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginResponse.access_token
$headers = @{ Authorization = "Bearer $token" }
Write-Host "   OK"

# ---------- 2. UPDATE COMPANY PROFILE ----------
Write-Host "2. Updating Company Profile..."
$companyBody = @{
    name       = "Kinetic Test Corp"
    mc_number  = "MC-987654"
    dot_number = "DOT-1234567"
    address    = "4500 Spring Valley Rd, Suite 300, Dallas, TX 75244"
    phone      = "(469) 555-0100"
    email      = "admin@testcompany.com"
} | ConvertTo-Json
try {
    $compRes = Invoke-RestMethod -Uri "$API_URL/settings/company" -Method Put -Body $companyBody -Headers $headers -ContentType "application/json"
    Write-Host "   Updated: $($compRes.name)"
} catch {
    Write-Host "   Skipped"
}

# ---------- 3. CREATE DRIVERS ----------
Write-Host "3. Creating Drivers..."
$driverSpecs = @(
    @{ first_name="Robert"; last_name="Williams"; email="robert.w@testcompany.com"; employment_type="company_w2"; pay_rate_type="cpm"; pay_rate_value=0.65; cdl_number="TX-A-78901"; cdl_class="A"; cdl_expiry_date="2028-06-15"; medical_card_expiry_date="2027-12-01"; experience_years=12 },
    @{ first_name="Michael"; last_name="Brown"; email="michael.b@testcompany.com"; employment_type="owner_operator_1099"; pay_rate_type="percentage"; pay_rate_value=85; cdl_number="TX-A-65432"; cdl_class="A"; cdl_expiry_date="2028-03-20"; medical_card_expiry_date="2027-09-15"; experience_years=8 },
    @{ first_name="Carlos"; last_name="Garcia"; email="carlos.g@testcompany.com"; employment_type="company_w2"; pay_rate_type="cpm"; pay_rate_value=0.62; cdl_number="TX-A-11223"; cdl_class="A"; cdl_expiry_date="2027-11-30"; medical_card_expiry_date="2027-06-01"; experience_years=5 },
    @{ first_name="James"; last_name="Thompson"; email="james.t@testcompany.com"; employment_type="lease_operator"; pay_rate_type="fixed_per_load"; pay_rate_value=1200; cdl_number="TX-A-99887"; cdl_class="A"; cdl_expiry_date="2029-01-15"; medical_card_expiry_date="2028-03-01"; experience_years=15 },
    @{ first_name="David"; last_name="Martinez"; email="david.m@testcompany.com"; employment_type="company_w2"; pay_rate_type="cpm"; pay_rate_value=0.58; cdl_number="TX-A-55667"; cdl_class="A"; cdl_expiry_date="2028-08-20"; medical_card_expiry_date="2027-11-15"; experience_years=3 },
    @{ first_name="Kevin"; last_name="Johnson"; email="kevin.j@testcompany.com"; employment_type="owner_operator_1099"; pay_rate_type="percentage"; pay_rate_value=82; cdl_number="TX-A-44556"; cdl_class="A"; cdl_expiry_date="2028-04-10"; medical_card_expiry_date="2027-10-05"; experience_years=10 }
)
$driverIds = @()
foreach ($spec in $driverSpecs) {
    $body = $spec | ConvertTo-Json
    try {
        $res = Invoke-RestMethod -Uri "$API_URL/drivers" -Method Post -Body $body -Headers $headers -ContentType "application/json"
        $driverIds += $res.id
        Write-Host "   Driver: $($spec.first_name) $($spec.last_name)"
    } catch {
        Write-Host "   Skip driver: $($spec.first_name)"
    }
}
Write-Host "   Total drivers: $($driverIds.Count)"

# ---------- 4. CREATE FLEET ----------
Write-Host "4. Creating Fleet..."
$truckSpecs = @(
    @{ unit_number="TRK-201"; make="Freightliner"; model="Cascadia"; year=2023; vin="1FUJGLDR5PLAB2001"; plate_number="TX-AA-2001" },
    @{ unit_number="TRK-202"; make="Kenworth"; model="T680"; year=2022; vin="1XKYD49X2MJ502002"; plate_number="TX-BB-2002" },
    @{ unit_number="TRK-203"; make="Peterbilt"; model="579"; year=2024; vin="1XPWD49X4PD902003"; plate_number="TX-CC-2003" },
    @{ unit_number="TRK-204"; make="Volvo"; model="VNL860"; year=2021; vin="4V4NC9EH8MN302004"; plate_number="TX-DD-2004" },
    @{ unit_number="TRK-205"; make="International"; model="LT"; year=2023; vin="3HSDJSJR4MN502005"; plate_number="TX-EE-2005" },
    @{ unit_number="TRK-206"; make="Mack"; model="Anthem"; year=2022; vin="1M1AN07Y8MM102006"; plate_number="TX-FF-2006" }
)
$truckIds = @()
foreach ($spec in $truckSpecs) {
    $body = ($spec + @{ status = "available" }) | ConvertTo-Json
    try {
        $res = Invoke-RestMethod -Uri "$API_URL/fleet/trucks" -Method Post -Body $body -Headers $headers -ContentType "application/json"
        $truckIds += $res.id
        Write-Host "   Truck: $($spec.unit_number)"
    } catch { Write-Host "   Skip truck: $($spec.unit_number)" }
}

$trailerSpecs = @(
    @{ unit_number="TRL-301"; type="dry_van"; make="Great Dane"; year=2022; vin="1GRAA0626NB301001"; plate_number="TX-TR-3001" },
    @{ unit_number="TRL-302"; type="reefer"; make="Utility"; year=2023; vin="1UYVS2536NU301002"; plate_number="TX-TR-3002" },
    @{ unit_number="TRL-303"; type="dry_van"; make="Wabash"; year=2021; vin="1JJV532D7ML301003"; plate_number="TX-TR-3003" },
    @{ unit_number="TRL-304"; type="flatbed"; make="Fontaine"; year=2023; vin="13N14830XP1301004"; plate_number="TX-TR-3004" },
    @{ unit_number="TRL-305"; type="dry_van"; make="Hyundai"; year=2024; vin="3H3V532C8PL301005"; plate_number="TX-TR-3005" },
    @{ unit_number="TRL-306"; type="reefer"; make="Carrier"; year=2022; vin="1UYVS253XNU301006"; plate_number="TX-TR-3006" }
)
$trailerIds = @()
foreach ($spec in $trailerSpecs) {
    $body = ($spec + @{ status = "available" }) | ConvertTo-Json
    try {
        $res = Invoke-RestMethod -Uri "$API_URL/fleet/trailers" -Method Post -Body $body -Headers $headers -ContentType "application/json"
        $trailerIds += $res.id
        Write-Host "   Trailer: $($spec.unit_number)"
    } catch { Write-Host "   Skip trailer: $($spec.unit_number)" }
}
Write-Host "   Total trucks: $($truckIds.Count), trailers: $($trailerIds.Count)"

# ---------- 5. CREATE LOADS WITH STATE MACHINE ----------
Write-Host "5. Creating Loads with state transitions..."

$routes = @(
    @{ pc="Dallas"; ps="TX"; dc="Atlanta"; ds="GA"; mi=780; rt=2800 },
    @{ pc="Houston"; ps="TX"; dc="Memphis"; ds="TN"; mi=560; rt=2200 },
    @{ pc="Chicago"; ps="IL"; dc="Denver"; ds="CO"; mi=1003; rt=3500 },
    @{ pc="Los Angeles"; ps="CA"; dc="Phoenix"; ds="AZ"; mi=373; rt=1600 },
    @{ pc="Miami"; ps="FL"; dc="Charlotte"; ds="NC"; mi=650; rt=2400 },
    @{ pc="Nashville"; ps="TN"; dc="Indianapolis"; ds="IN"; mi=290; rt=1400 },
    @{ pc="San Antonio"; ps="TX"; dc="Oklahoma City"; ds="OK"; mi=480; rt=1900 },
    @{ pc="Jacksonville"; ps="FL"; dc="Richmond"; ds="VA"; mi=630; rt=2300 },
    @{ pc="Louisville"; ps="KY"; dc="Pittsburgh"; ds="PA"; mi=390; rt=1700 },
    @{ pc="Minneapolis"; ps="MN"; dc="Cincinnati"; ds="OH"; mi=690; rt=2600 },
    @{ pc="Kansas City"; ps="MO"; dc="St Louis"; ds="MO"; mi=250; rt=1200 },
    @{ pc="Columbus"; ps="OH"; dc="Detroit"; ds="MI"; mi=200; rt=1100 },
    @{ pc="El Paso"; ps="TX"; dc="Albuquerque"; ds="NM"; mi=268; rt=1350 },
    @{ pc="Tampa"; ps="FL"; dc="Savannah"; ds="GA"; mi=400; rt=1650 },
    @{ pc="Portland"; ps="OR"; dc="Sacramento"; ds="CA"; mi=580; rt=2100 },
    @{ pc="Laredo"; ps="TX"; dc="Dallas"; ds="TX"; mi=440; rt=1800 },
    @{ pc="Boston"; ps="MA"; dc="Philadelphia"; ds="PA"; mi=310; rt=1500 },
    @{ pc="Seattle"; ps="WA"; dc="Boise"; ds="ID"; mi=500; rt=2000 },
    @{ pc="Raleigh"; ps="NC"; dc="Baltimore"; ds="MD"; mi=330; rt=1550 },
    @{ pc="Fresno"; ps="CA"; dc="Las Vegas"; ds="NV"; mi=270; rt=1300 }
)

# Target status for each load index
$targets = @("planned","planned","planned","dispatched","dispatched","dispatched","in_transit","in_transit","in_transit","in_transit","delivered","delivered","delivered","delivered","delivered","delivered","billed","billed","paid","paid")

# Transitions needed to reach each target status
$paths = @{
    "planned"    = @()
    "dispatched" = @("dispatched")
    "in_transit" = @("dispatched","at_pickup","in_transit")
    "delivered"  = @("dispatched","at_pickup","in_transit","delivered")
    "billed"     = @("dispatched","at_pickup","in_transit","delivered","billed")
    "paid"       = @("dispatched","at_pickup","in_transit","delivered","billed","paid")
}

$loadIds = @()
$deliveredLoadIds = @()
$driverLoadMap = @{}

for ($i = 0; $i -lt $routes.Count; $i++) {
    $r = $routes[$i]
    $ts = $targets[$i]
    $di = $i % $driverIds.Count
    $ti = $i % $truckIds.Count
    $tri = $i % $trailerIds.Count

    $day1 = [Math]::Max(1, [Math]::Min(28, 10 + $i))
    $day2 = [Math]::Max(1, [Math]::Min(28, 12 + $i))
    $sd1 = "2026-03-{0:D2}" -f $day1
    $sd2 = "2026-03-{0:D2}" -f $day2

    $loadBody = @{
        base_rate = $r.rt
        total_miles = $r.mi
        notes = "$($r.pc) to $($r.dc) shipment"
        stops = @(
            @{ stop_type="pickup"; stop_sequence=1; city=$r.pc; state=$r.ps; facility_name="$($r.pc) DC"; scheduled_date=$sd1 },
            @{ stop_type="delivery"; stop_sequence=2; city=$r.dc; state=$r.ds; facility_name="$($r.dc) WH"; scheduled_date=$sd2 }
        )
        accessorials = @()
    }
    $loadJson = $loadBody | ConvertTo-Json -Depth 5

    try {
        $loadRes = Invoke-RestMethod -Uri "$API_URL/loads" -Method Post -Body $loadJson -Headers $headers -ContentType "application/json"
        $lid = $loadRes.id
        $loadIds += $lid
        Write-Host "   Load $($loadRes.load_number): $($r.pc) -> $($r.dc) @ $($r.rt)"

        $steps = $paths[$ts]
        if ($steps.Count -gt 0) {
            # Assign driver+truck+trailer first
            $ab = @{ driver_id=$driverIds[$di]; truck_id=$truckIds[$ti]; trailer_id=$trailerIds[$tri] } | ConvertTo-Json
            try {
                Invoke-RestMethod -Uri "$API_URL/loads/$lid/assign" -Method Patch -Body $ab -Headers $headers -ContentType "application/json" | Out-Null
            } catch {
                Write-Host "     Assign skipped"
            }

            # Walk through transitions
            foreach ($step in $steps) {
                $sb = @{ status=$step } | ConvertTo-Json
                try {
                    Invoke-RestMethod -Uri "$API_URL/loads/$lid/status" -Method Patch -Body $sb -Headers $headers -ContentType "application/json" | Out-Null
                } catch {
                    Write-Host "     Transition $step failed"
                    break
                }
            }
            Write-Host "     => $ts"
        }

        if ($ts -in @("delivered","billed","paid")) {
            $deliveredLoadIds += $lid
            $driverLoadMap[$driverIds[$di]] = $true
        }
    } catch {
        Write-Host "   LOAD FAILED: $($r.pc)"
    }
}
Write-Host "   Total loads: $($loadIds.Count)"

# ---------- 6. GENERATE SETTLEMENTS ----------
Write-Host "6. Generating Settlements..."
foreach ($did in $driverLoadMap.Keys) {
    $sb = @{ driver_id=$did; period_start="2026-03-01"; period_end="2026-03-31" } | ConvertTo-Json
    try {
        $stl = Invoke-RestMethod -Uri "$API_URL/accounting/settlements/generate" -Method Post -Body $sb -Headers $headers -ContentType "application/json"
        Write-Host "   Settlement $($stl.settlement_number): Net $($stl.net_pay)"
    } catch {
        Write-Host "   Settlement skipped for $did"
    }
}

# ---------- 7. GENERATE INVOICES ----------
Write-Host "7. Generating Invoices..."
foreach ($lid in $deliveredLoadIds) {
    try {
        $inv = Invoke-RestMethod -Uri "$API_URL/accounting/loads/$lid/invoice" -Method Post -Headers $headers -ContentType "application/json"
        Write-Host "   Invoice $($inv.load_number): $($inv.total_amount)"
    } catch {
        Write-Host "   Invoice skipped"
    }
}

Write-Host ""
Write-Host "DONE! Drivers=$($driverIds.Count) Trucks=$($truckIds.Count) Trailers=$($trailerIds.Count) Loads=$($loadIds.Count) Delivered=$($deliveredLoadIds.Count)"
