// Test Zillow API directly
const API_KEY = 'e72b031e5bmsh09b135d72a9f812p1daac6jsnbd790750bcc7';
const HOST = 'zillow-com1.p.rapidapi.com';

async function testZillowAPI() {
  try {
    console.log('Testing Zillow API...');
    
    // Try different endpoints
    const endpoints = [
      '/propertyExtendedSearch?location=Blacksburg%2C%20VA',
      '/search?location=Blacksburg%2C%20VA', 
      '/properties?location=Blacksburg%2C%20VA',
      '/property?zpid=197832' // Test with sample zpid
    ];
    
    for (const endpoint of endpoints) {
      console.log(`\nTrying endpoint: ${endpoint}`);
      const response = await fetch(`https://${HOST}${endpoint}`, {
      headers: {
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': HOST,
      },
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('SUCCESS! Working endpoint:', endpoint);
        console.log('Sample data:', JSON.stringify(data, null, 2).substring(0, 500));
        return;
      } else {
        console.log('Failed:', response.status, response.statusText);
      }
    }
    
    console.log('No working endpoints found');
    
  } catch (error) {
    console.error('Request failed:', error);
  }
}

testZillowAPI();