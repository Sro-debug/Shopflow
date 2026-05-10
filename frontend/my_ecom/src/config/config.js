const config = {
  API_URL: import.meta.env.VITE_API_URL || '/api',
  WS_URL: import.meta.env.VITE_WS_URL || 'http://localhost:5000',
  RAZORPAY_KEY_ID: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  APP_NAME: 'ShopFlow',
  CURRENCY: 'INR',
  CURRENCY_SYMBOL: '₹',
  FREE_SHIPPING_THRESHOLD: 500,
  TAX_RATE: 0.18,
};

export default config;
