const { serviceClient } = require('./_supabase');
module.exports = async (req,res)=>{
  try{
    if(req.method!=='POST')return res.status(405).send('Method not allowed');
    const p=req.body||{}; const store=process.env.SSLCOMMERZ_STORE_ID, pass=process.env.SSLCOMMERZ_STORE_PASSWORD; if(!store||!pass)return res.status(503).send('Not configured');
    if(!p.val_id)return res.status(400).send('Missing val_id');
    const endpoint=String(process.env.SSLCOMMERZ_SANDBOX).toLowerCase()==='false'?'https://securepay.sslcommerz.com/validator/api/validationserverAPI.php':'https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php';
    const url=`${endpoint}?val_id=${encodeURIComponent(p.val_id)}&store_id=${encodeURIComponent(store)}&store_passwd=${encodeURIComponent(pass)}&format=json`;
    const r=await fetch(url);const d=await r.json();if(d.status!=='VALID'&&d.status!=='VALIDATED')return res.status(400).json({ok:false,status:d.status||'INVALID'});
    const userId=p.value_a;const db=serviceClient();if(userId){await db.from('payments').upsert({user_id:userId,provider:'sslcommerz',provider_payment_id:p.bank_tran_id||p.tran_id,amount:Number(d.amount||p.amount||0),currency:d.currency||p.currency||'BDT',status:'paid',type:'subscription',metadata:d,created_at:new Date().toISOString()},{onConflict:'provider_payment_id'});await db.from('subscriptions').upsert({user_id:userId,provider:'sslcommerz',provider_subscription_id:p.tran_id,plan_id:p.value_b||'premium_monthly',plan_name:p.value_b||'Premium',status:'active',current_period_end:new Date(Date.now()+((p.value_b||'').includes('yearly')?365:30)*86400000).toISOString(),metadata:{validation:d}},{onConflict:'provider_subscription_id'});}return res.status(200).json({ok:true});
  }catch(e){return res.status(500).json({ok:false,error:e.message})}
};
