// netlify/functions/env-check.js
exports.handler = async () => {
  const present = {
    STRIPE_API_KEY: !!process.env.STRIPE_API_KEY,
    STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE: !!process.env.SUPABASE_SERVICE_ROLE,
    NODE_VERSION: process.version
  };
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(present)
  };
};
