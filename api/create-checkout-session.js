const Stripe = require('stripe');
const { requireUser, json } = require('./_supabase');

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
    const { user, supabase } = await requireUser(req);
    if (!process.env.STRIPE_SECRET_KEY) return json(res, 503, { error: 'Stripe is not configured on the server.' });
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const { planId, priceId } = req.body || {};
    const allowed = {
      premium_monthly: process.env.STRIPE_PRICE_MONTHLY,
      premium_yearly: process.env.STRIPE_PRICE_YEARLY
    };
    const selectedPrice = priceId && Object.values(allowed).includes(priceId) ? priceId : allowed[planId || 'premium_yearly'];
    if (!selectedPrice) return json(res, 400, { error: 'No valid Stripe price is configured.' });

    const { data: existing } = await supabase.from('subscriptions').select('provider_customer_id').eq('user_id', user.id).eq('provider','stripe').not('provider_customer_id','is',null).maybeSingle();
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: existing?.provider_customer_id || undefined,
      customer_email: existing?.provider_customer_id ? undefined : user.email,
      client_reference_id: user.id,
      metadata: { user_id: user.id, plan_id: planId || 'premium_yearly' },
      subscription_data: { metadata: { user_id: user.id, plan_id: planId || 'premium_yearly' } },
      success_url: `${process.env.APP_URL || req.headers.origin}/dashboard.html?checkout=success`,
      cancel_url: `${process.env.APP_URL || req.headers.origin}/earn.html?checkout=cancelled`,
      line_items: [{ price: selectedPrice, quantity: 1 }],
      allow_promotion_codes: true
    });
    return json(res, 200, { url: session.url, sessionId: session.id });
  } catch (e) { return json(res, e.status || 500, { error: e.message || 'Checkout failed.' }); }
};
