const crypto = require("crypto");

exports.handler = async function (event) {
  try {
    const sig = event.headers["stripe-signature"];
    const secret = process.env.STRIPE_WEBHOOK_SECRET;

    // Validação básica do evento
    if (!sig || !secret) {
      return { statusCode: 400, body: "Webhook não configurado." };
    }

    const hash = crypto.createHmac("sha256", secret).update(event.body).digest("hex");
    console.log("Webhook Stripe recebido:", hash);

    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  } catch (err) {
    console.error("Erro no webhook Stripe:", err);
    return { statusCode: 500, body: "Erro interno" };
  }
};
