const { requireUser, json, serviceClient } = require('./_supabase');
const crypto = require('crypto');

module.exports = async (req,res)=>{
  try{
    if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
    const {user}=await requireUser(req); const {planId='premium_monthly'}=req.body||{};
    const prices={premium_monthly:9.99,premium_yearly:49.99}; const amount=prices[planId]; if(!amount)return json(res,400,{error:'Invalid plan.'});
    const store=process.env.SSLCOMMERZ_STORE_ID, pass=process.env.SSLCOMMERZ_STORE_PASSWORD; if(!store||!pass||store==='replace_me')return json(res,503,{error:'SSLCommerz is not configured.'});
    const base=process.env.APP_URL||req.headers.origin; const tranId=`ULM-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const endpoint=String(process.env.SSLCOMMERZ_SANDBOX).toLowerCase()==='false'?'https://securepay.sslcommerz.com/gwprocess/v4/api.php':'https://sandbox.sslcommerz.com/gwprocess/v4/api.php';
    const body=new URLSearchParams({store_id:store,store_passwd:pass,total_amount:amount.toFixed(2),currency:'USD',tran_id:tranId,success_url:`${base}/api/sslcommerz-callback?status=success`,fail_url:`${base}/api/sslcommerz-callback?status=failed`,cancel_url:`${base}/api/sslcommerz-callback?status=cancelled`,ipn_url:`${base}/api/sslcommerz-ipn`,cus_name:user.user_metadata?.name||user.email?.split('@')[0]||'Customer',cus_email:user.email||'',cus_add1:'Bangladesh',cus_city:'Dhaka',cus_country:'Bangladesh',cus_phone:'',shipping_method:'NO',product_name:`ULMFlix ${planId}`,product_category:'subscription',product_profile:'general',value_a:user.id,value_b:planId});
    const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body}); const d=await r.json(); if(!r.ok||!d.GatewayPageURL)return json(res,502,{error:d.failedreason||'SSLCommerz session could not be created.'});
    return json(res,200,{url:d.GatewayPageURL,transactionId:tranId});
  }catch(e){return json(res,e.status||500,{error:e.message||'Payment initialization failed.'})}
};
