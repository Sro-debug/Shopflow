/**
 * Validates required environment variables at startup.
 * Call this before any other imports that depend on env vars.
 */
function validateEnv() {
  const required = [
    'MONGO_URI',
    'JWT_SECRET',
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
  ];

  const warnings = [
    'RAZORPAY_WEBHOOK_SECRET',
    'CLIENT_URL',
    'CACHE_NODES',
  ];

  const missing = required.filter((k) => !process.env[k]);

  if (missing.length > 0) {
    console.error('\n❌  Missing required environment variables:\n');
    missing.forEach((k) => console.error(`   • ${k}`));
    console.error('\n   Copy backend/.env.example → backend/.env and fill in values.\n');
    process.exit(1);
  }

  const notSet = warnings.filter((k) => !process.env[k]);
  if (notSet.length > 0) {
    console.warn('\n⚠️   Optional env vars not set (using defaults):');
    notSet.forEach((k) => console.warn(`   • ${k}`));
    console.warn('');
  }
}

module.exports = validateEnv;
