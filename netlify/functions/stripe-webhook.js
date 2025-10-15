// netlify/functions/stripe-webhook.js
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

/**
 * ENV requeridas no Netlify:
 * - STRIPE_SECRET_KEY            (sk_test_...)
 * - STRIPE_WEBHOOK_SECRET        (whsec_...)
 * - SUPABASE_URL                 (https://...supabase.co)
 * - SUPABASE_SERVICE_ROLE        (chave service role do supabase)
 */

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

const sbAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE,
  {
    auth: { persistSession: false },
  }
);

// Helper: registra id do evento para idempotência
async function alreadyProcessed(eventId) {
  const { data, error } = await sbAdmin
    .from('webhook_events')
    .select('id')
    .eq('id', eventId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

async function markProcessed(eventId) {
  const { error } = await sbAdmin
    .from('webhook_events')
    .insert({ id: eventId });
  if (error) throw error;
}

export const handler = async (req) => {
  if (req.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const sig = req.headers['stripe-signature'];
  if (!sig) {
    return { statusCode: 400, body: 'Missing stripe-signature' };
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('⚠️  Webhook signature verification failed.', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  try {
    // Idempotência
    const done = await alreadyProcessed(event.id);
    if (done) {
      return { statusCode: 200, body: 'Already processed' };
    }

    // Tratamento dos eventos
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      // Dados principais
      const email = session.customer_details?.email || session.customer_email;
      const amountTotal = session.amount_total; // em centavos (BRL)
      const currency = (session.currency || '').toUpperCase();

      // Apenas BRL e apenas "paid"
      if (session.payment_status !== 'paid') {
        await markProcessed(event.id);
        return { statusCode: 200, body: 'Ignored: not paid' };
      }
      if (currency !== 'BRL') {
        console.warn('Non-BRL currency received, ignoring:', currency);
        await markProcessed(event.id);
        return { statusCode: 200, body: 'Ignored: non-BRL' };
      }
      if (!email) {
        console.warn('No email in session; cannot map to profile.');
        await markProcessed(event.id);
        return { statusCode: 200, body: 'Ignored: missing email' };
      }

      // Braincoins = valor em reais (1 BC = R$1) => amount_total (centavos)
      // Descrição amigável
      const desc =
        session.metadata?.description ||
        `Crédito Stripe (${(amountTotal / 100).toFixed(2)} BC)`;

      // chama RPC de crédito por email
      const { error: rpcErr } = await sbAdmin.rpc('wallet_credit_by_email', {
        p_email: email,
        p_amount_cents: amountTotal,
        p_description: desc,
      });
      if (rpcErr) {
        console.error('wallet_credit_by_email error:', rpcErr);
        // Mesmo em caso de erro de crédito (ex.: perfil não encontrado), marcamos processado
        // para evitar reprocessar infinitamente. Você pode auditar no Stripe Dashboard.
      }
    }

    // Marca como processado por último
    await markProcessed(event.id);
    return { statusCode: 200, body: 'ok' };
  } catch (err) {
    console.error('Webhook handler error:', err);
    // não marca como processado em erro desconhecido
    return { statusCode: 500, body: 'Internal Error' };
  }
};

// Netlify precisa do body "raw" (sem JSON parse)
export const config = {
  bodyParser: false,
};
