// API Configuration
// Using permanent domain - no more dynamic URLs needed!
export const API_BASE_URL = 'https://api.mpy3juice.cfd';

// Log the API URL being used
if (typeof window !== 'undefined') {
  console.log('🔧 PDF API Configuration:');
  console.log('   Using permanent URL:', API_BASE_URL);
  console.log('   No more dynamic URLs! 🎉');
}
