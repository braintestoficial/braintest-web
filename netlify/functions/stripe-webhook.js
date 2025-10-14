// netlify/functions/stripe-webhook.js
const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  // Stripe exige o raw body para verificar a assinatura
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const stripe = new Stripe(process.env.STRIPE_API_KEY);
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

  const sig = event.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let type, data;

  try {
    const stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      webhookSecret
    );
    type = stripeEvent.type;
    data = stripeEvent.data.object;
  } catch (err) {
    console.error('❌ Erro ao validar webhook Stripe:', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  try {
    if (type === 'checkout.session.completed') {
      // Sessão concluída
      const session = data;

      // 1) Obter e-mail do comprador
      const email = session.customer_details?.email || session.customer_email;
      if (!email) {
        console.warn('⚠️ checkout.session.completed sem e-mail do cliente.');
        return { statusCode: 200, body: 'No email; ignoring.' };
      }

      // 2) Total pago em centavos (BRL) => Braincoins = amount_total/100
      const amountTotal = session.amount_total || 0; // em centavos
      if (amountTotal <= 0) {
        console.warn('⚠️ checkout.session.completed com amount_total inválido.');
        return { statusCode: 200, body: 'Invalid amount; ignoring.' };
      }
      const braincoinsCents = amountTotal; // 1 real == 1 braincoin; armazenamos em centavos

      // 3) Idempotência: evitar crédito duplicado usando event.id como referência externa
      const externalId = session.id; // único da sessão
      // Se já houver transação com esse external_id, ignorar
      const { data: existing, error: existingErr } = await supabase
        .from('wallet_transactions')
        .select('id')
        .eq('external_id', externalId)
        .limit(1);

      if (existingErr) {
        console.error('Erro ao checar transação existente:', existingErr);
        return { statusCode: 500, body: 'DB error' };
      }
      if (existing && existing.length) {
        // Já processado
        return { statusCode: 200, body: 'Already processed' };
      }

      // 4) Encontrar o usuário pelo e-mail
      //    A tabela de usuários do Supabase Auth fica em auth.users (não acessível direto via anon key).
      //    Então, você deve ter uma tabela "profiles" sincronizada com user_id + email.
      //    Se não tiver, podemos localizar pela tabela wallets (precisa do user_id).
      //    Estratégia simples: procurar na sua tabela "profiles" pelo e-mail.
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('user_id, email')
        .ilike('email', email)
        .single();

      if (profileErr || !profile) {
        console.error('Usuário não encontrado para o e-mail:', email, profileErr);
        return { statusCode: 200, body: 'User not found by email' }; // não falhar o webhook
      }

      const userId = profile.user_id;

      // 5) Garantir carteira existente (upsert)
      const { data: wallet, error: walletErr } = await supabase
        .from('wallets')
        .upsert({ user_id: userId, balance_cents: 0 }, { onConflict: 'user_id' })
        .select('balance_cents')
        .single();

      if (walletErr) {
        console.error('Erro ao garantir carteira:', walletErr);
        return { statusCode: 500, body: 'Wallet upsert error' };
      }

      // 6) Incrementar saldo com segurança (service role ignora RLS)
      const newBalance = (wallet?.balance_cents || 0) + braincoinsCents;
      const { error: upErr } = await supabase
        .from('wallets')
        .update({ balance_cents: newBalance })
        .eq('user_id', userId);

      if (upErr) {
        console.error('Erro ao atualizar saldo:', upErr);
        return { statusCode: 500, body: 'Update balance error' };
      }

      // 7) Registrar transação TOPUP com external_id (idempotência)
      const descricao = `Top-up Stripe (${(braincoinsCents/100).toFixed(2)} Braincoins)`;
      const { error: txErr } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: userId,
          kind: 'topup',
          amount_cents: braincoinsCents,
          description: descricao,
          external_id: externalId
        });

      if (txErr) {
        console.error('Erro ao inserir transação:', txErr);
        return { statusCode: 500, body: 'Insert transaction error' };
      }

      console.log(`✅ Créditos adicionados: +${braincoinsCents/100} BC para ${email}`);
    }

    return { statusCode: 200, body: 'ok' };
  } catch (err) {
    console.error('❌ Erro no handler do webhook:', err);
    return { statusCode: 500, body: 'Internal error' };
  }
};
  