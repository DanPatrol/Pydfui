// Fetch PDF API URL from Google Sheets
// This runs before the app loads to get the dynamic Cloudflare tunnel URL

const SHEET_ID = '16vzRuCGHzgRor2lmhRHyEbn8KFLdDnw1hbaF4xeTELo';
const RANGE = 'Sheet1!D1'; // PDF API URL is in cell D1
const API_KEY = 'AIzaSyBxqVHEqJXxqXxqXxqXxqXxqXxqXxqXxqX'; // Replace with your Google Sheets API key

async function fetchApiUrl() {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.values && data.values[0] && data.values[0][0]) {
      const apiUrl = data.values[0][0];
      // Store in localStorage for the app to use
      localStorage.setItem('PDF_API_URL', apiUrl);
      console.log('✅ PDF API URL loaded:', apiUrl);
      return apiUrl;
    } else {
      console.warn('⚠️ No API URL found in sheet, using fallback');
      return null;
    }
  } catch (error) {
    console.error('❌ Error fetching API URL:', error);
    return null;
  }
}

// Run immediately
fetchApiUrl();
