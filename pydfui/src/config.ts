// API Configuration
// Contabo-hosted backend — permanent domain.
export const API_BASE_URL = 'https://api.pdfworkshop.sbs';

// Log the API URL being used
if (typeof window !== 'undefined') {
  console.log('🔧 PDF API Configuration:');
  console.log('   Using permanent URL:', API_BASE_URL);
  console.log('   No more dynamic URLs! 🎉');
}
