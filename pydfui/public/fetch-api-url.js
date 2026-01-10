// Fetch PDF API URL from Google Sheets (published to web)
// This runs before the app loads to get the dynamic Cloudflare tunnel URL

const SHEET_ID = '16vzRuCGHzgRor2lmhRHyEbn8KFLdDnw1hbaF4xeTELo';

async function fetchApiUrl() {
  try {
    // Use Google Visualization API - works with published sheets without API key
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&range=D1`;
    const response = await fetch(url);
    const text = await response.text();
    
    // Remove the callback wrapper: google.visualization.Query.setResponse(...)
    const jsonText = text.substring(47, text.length - 2);
    const data = JSON.parse(jsonText);
    
    // Extract cell D1 value
    if (data.table && data.table.rows && data.table.rows[0] && data.table.rows[0].c && data.table.rows[0].c[0]) {
      const apiUrl = data.table.rows[0].c[0].v;
      
      if (apiUrl && apiUrl.startsWith('http')) {
        const currentUrl = localStorage.getItem('PDF_API_URL');
        
        // Always update to ensure we have the latest URL
        localStorage.setItem('PDF_API_URL', apiUrl);
        
        if (currentUrl !== apiUrl) {
          console.log('🔄 PDF API URL updated from Google Sheets');
          console.log('   Old:', currentUrl || 'none');
          console.log('   New:', apiUrl);
        } else {
          console.log('✅ PDF API URL loaded from Google Sheets:', apiUrl);
        }
        
        return apiUrl;
      }
    }
    
    console.warn('⚠️ No API URL found in sheet, using fallback');
    return null;
  } catch (error) {
    console.error('❌ Error fetching API URL from Google Sheets:', error);
    return null;
  }
}

// Run immediately
fetchApiUrl();
