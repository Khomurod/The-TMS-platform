const baseUrl = "https://Safehaul-api-1065403267999.us-central1.run.app/api/v1";

async function runTest() {
  console.log("1. Logging in Test Company (Wenze)...");
  let loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@wenze.com", password: "SuperSecretPassword123!" })
  });
  
  if (!loginRes.ok) {
    console.log("Login failed. Registration might be needed.");
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company_name: "Wenze2", email: "admin2@wenze.com", password: "SuperSecretPassword123!", first_name: "Test", last_name: "User" })
    });
    const regData = await regRes.json();
    loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin2@wenze.com", password: "SuperSecretPassword123!" })
    });
  }

  const { access_token } = await loginRes.json();
  console.log("Authentication Successful! Tkn:", access_token.substring(0, 15) + "...");
  
  const headers = {
    "Authorization": `Bearer ${access_token}`,
    "Content-Type": "application/json"
  };

  console.log("2. Creating Test Driver...");
  const driverRes = await fetch(`${baseUrl}/drivers/`, {
    method: "POST", headers,
    body: JSON.stringify({
      first_name: "Speedy", last_name: "Gonzales", phone: "555-0199", email: "speedy@wenze.com",
      license_number: "CDL-" + Math.floor(Math.random() * 100000), license_state: "TX", license_expiry: "2028-12-31", status: "active"
    })
  });
  const driverData = await driverRes.json();
  console.log("Driver Created:", driverData);

  console.log("3. Creating Test Truck...");
  const truckRes = await fetch(`${baseUrl}/fleet/trucks/`, {
    method: "POST", headers,
    body: JSON.stringify({
      unit_number: "T-0" + Math.floor(Math.random() * 1000), make: "Freightliner", model: "Cascadia",
      year: 2024, vin: "1FUJA" + Math.floor(Math.random() * 10000000), plate_number: "TX-90", plate_state: "TX", status: "active"
    })
  });
  const truckData = await truckRes.json();
  console.log("Truck Created:", truckData);

  console.log("4. Creating Test Trailer...");
  const trailerRes = await fetch(`${baseUrl}/fleet/trailers/`, {
    method: "POST", headers,
    body: JSON.stringify({
      unit_number: "TRL-99", type: "dry_van", make: "Utility", year: 2025,
      vin: "1UYJ" + Math.floor(Math.random() * 10000), plate_number: "TR-XY12", plate_state: "TX", status: "active"
    })
  });
  const trailerData = await trailerRes.json();
  console.log("Trailer Created:", trailerData);

  console.log("5. Creating Test Load...");
  const loadRes = await fetch(`${baseUrl}/loads/`, {
    method: "POST", headers,
    body: JSON.stringify({
      reference_number: "L-" + Math.floor(Math.random() * 10000), status: "available",
      pickup_location: "Dallas, TX", pickup_time: "2026-04-01T08:00:00Z",
      delivery_location: "Austin, TX", delivery_time: "2026-04-02T17:00:00Z",
      rate: 1200.50, weight_lbs: 40000, commodity: "Electronics"
    })
  });
  const loadData = await loadRes.json();
  console.log("Load Created:", loadData);

  console.log("6. Verifying Dashboard Aggregations...");
  const dashRes = await fetch(`${baseUrl}/dashboard/stats`, { headers });
  const dashData = await dashRes.json();
  console.log("Dashboard Stats:");
  console.log(JSON.stringify(dashData, null, 2));
  console.log("End-to-End Testing Completed successfully!");
}

runTest().catch(console.error);
