/**
 * Diagnostic script to test backend API connectivity and CORS.
 * Run with Node.js 18+ (which has native fetch).
 */

async function testBackend() {
  const url = 'https://kinetic-api-1065403267999.us-central1.run.app/api/v1/loads';
  console.log(`Testing connection to: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Origin': 'https://kinetic-frontend-1065403267999.us-central1.run.app',
        'Accept': 'application/json'
      }
    });
    
    console.log(`\n--- RESPONSE STATUS ---`);
    console.log(`${response.status} ${response.statusText}`);
    
    console.log(`\n--- CORS HEADERS ---`);
    const corsHeaders = ['access-control-allow-origin', 'access-control-allow-methods', 'access-control-allow-credentials'];
    corsHeaders.forEach(header => {
      console.log(`${header}: ${response.headers.get(header) || 'MISSING'}`);
    });
    
    console.log(`\n--- RESPONSE BODY (Excerpt) ---`);
    const text = await response.text();
    console.log(text.substring(0, 250) + (text.length > 250 ? '...' : ''));
    
  } catch (error) {
    console.error('\n❌ NETWORK/FETCH ERROR:', error.message);
  }
}

testBackend();
