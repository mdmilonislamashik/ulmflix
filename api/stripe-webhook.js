const Stripe = require('stripe');
const { serviceClient } = require('./_supabase');
module.exports = async (req,res)=>{
  if(req.method!=='POST')return res.status(405).send('Method not allowed');
  try{
    const stripe=new Stripe(process.env.STRIPE_SECRET_KEY);const sig=req.headers['stripe-signature'];
    const event=stripe.webhooks.constructEvent(req.rawBody||req.body,sig,process.env.STRIPE_WEBHOOK_SECRET);const db=serviceClient();
    if(event.type==='checkout.session.completed'){
      const s=event.data.object,u=s.metadata?.user_id||s.client_reference_id;if(u&&s.subscription){const sub=await stripe.subscriptions.retrieve(s.subscription);await syncSubscription(db,u,s.customer,sub);}
    } else if(event.type==='customer.subscription.created'||event.type==='customer.subscription.updated'||event.type==='customer.subscription.deleted'){
      const sub=event.data.object;const u=sub.metadata?.user_id;if(u)await syncSubscription(db,u,sub.customer,sub);
      else {const {data:row}=await db.from('subscriptions').select('user_id').eq('provider_subscription_id',sub.id).maybeSingle();if(row)await syncSubscription(db,row.user_id,sub.customer,sub);}
    } else if(event.type==='invoice.paid'||event.type==='invoice.payment_failed'){
      const invoice=event.data.object;const customer=invoice.customer;const {data:row}=await db.from('subscriptions').select('user_id,provider_subscription_id').eq('provider_customer_id',customer).maybeSingle();if(row){await db.from('payments').upsert({user_id:row.user_id,provider:'stripe',provider_payment_id:invoice.payment_intent||invoice.id,amount:Number(invoice.amount_paid||invoice.amount_due||0)/100,currency:(invoice.currency||'usd').toUpperCase(),status:event.type==='invoice.paid'?'paid':'failed',type:'subscription',metadata:{invoice_id:invoice.id},created_at:new Date().toISOString()},{onConflict:'provider_payment_id'});}}
    return res.status(200).json({received:true});
  }catch(e){return res.status(400).send(`Webhook Error: ${e.message}`)}
};
async function syncSubscription(db,userId,customerId,sub){const item=sub.items?.data?.[0];const periodEnd=item?.current_period_end?new Date(item.current_period_end*1000).toISOString():null;await db.from('subscriptions').upsert({user_id:userId,provider:'stripe',provider_customer_id:customerId,provider_subscription_id:sub.id,plan_id:item?.price?.id||'stripe',plan_name:item?.price?.nickname||'Premium',status:sub.status,current_period_end:periodEnd,metadata:{cancel_at_period_end:sub.cancel_at_period_end}}, {onConflict:'provider_subscription_id'});}
