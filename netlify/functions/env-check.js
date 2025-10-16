exports.handler = async function (event, context) {
  const info = {
    NODE_VERSION: process.version,
    SUPABASE_URL: process.env.SUPABASE_URL,
    STRIPE_STATUS: process.env.STRIPE_KEY ? "Configurado" : "Não configurado"
  };
  return {
    statusCode: 200,
    body: JSON.stringify(info, null, 2)
  };
};
