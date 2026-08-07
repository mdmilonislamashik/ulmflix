(function(){
'use strict';

const PROFILE_KEY='ULMFlix_global_profile_v1';
const LOCAL_PLAN_PREFIX='ULMFlix_income_plan_user_';
const countries=[
  ['BD','Bangladesh'],['IN','India'],['PK','Pakistan'],['NP','Nepal'],['LK','Sri Lanka'],
  ['US','United States'],['CA','Canada'],['GB','United Kingdom'],['AU','Australia'],['DE','Germany'],
  ['FR','France'],['IT','Italy'],['ES','Spain'],['NL','Netherlands'],['SE','Sweden'],['NO','Norway'],
  ['DK','Denmark'],['FI','Finland'],['AE','United Arab Emirates'],['SA','Saudi Arabia'],['QA','Qatar'],
  ['SG','Singapore'],['MY','Malaysia'],['ID','Indonesia'],['PH','Philippines'],['JP','Japan'],
  ['KR','South Korea'],['BR','Brazil'],['MX','Mexico'],['ZA','South Africa'],['NG','Nigeria'],
  ['KE','Kenya'],['GH','Ghana']
];
const currencies=['USD','BDT','INR','PKR','NPR','LKR','GBP','EUR','CAD','AUD','AED','SAR','SGD','MYR','IDR','PHP','JPY','KRW','BRL','MXN','ZAR','NGN','KES','GHS'];
const skills=['Writing','Video Editing','Graphic Design','Web Development','App Development','SEO','Marketing','Sales','Teaching','Translation','Photography','Animation','Programming','Data Analysis','AI / Automation','Voice / Audio','Social Media','Consulting','Customer Support','Research'];
const platforms=['YouTube','TikTok','Instagram','Facebook','LinkedIn','X','Google','Shopify','WordPress','GitHub','Fiverr','Upwork','Freelancer','Gumroad','Patreon','Substack','Udemy','Teachable','Amazon','Etsy','Canva','Notion','Stripe','PayPal','Local bank / wallet'];

const $=id=>document.getElementById(id);
const localProfile=()=>{try{return JSON.parse(localStorage.getItem(PROFILE_KEY))||{}}catch{return{}}};
const saveLocal=p=>localStorage.setItem(PROFILE_KEY,JSON.stringify(p));
const userId=async()=>window.SF_SUPABASE ? (await window.SF_SUPABASE.auth.getUser()).data.user?.id : null;
const planKey=uid=>LOCAL_PLAN_PREFIX+(uid||'guest');
const readPlan=uid=>{try{return JSON.parse(localStorage.getItem(planKey(uid)))||[]}catch{return[]}};
const money=(n,c)=>new Intl.NumberFormat(undefined,{style:'currency',currency:c||'USD',maximumFractionDigits:0}).format(Number(n)||0);

function fillSelect(id,items){
  const el=$(id); el.innerHTML='';
  items.forEach(x=>{const o=document.createElement('option');o.value=Array.isArray(x)?x[0]:x;o.textContent=Array.isArray(x)?`${x[1]} (${x[0]})`:x;el.append(o)});
}
function renderChips(id,items,selected){
  const el=$(id); el.innerHTML='';
  items.forEach(item=>{
    const b=document.createElement('button');b.type='button';b.className='chip'+(selected.includes(item)?' active':'');b.textContent=item;
    b.onclick=()=>{b.classList.toggle('active');renderMetrics();renderRecommendations()};
    el.append(b);
  });
}
function selectedChips(id){return [...$(id).querySelectorAll('.chip.active')].map(x=>x.textContent)}
function getProfileFromUI(){
  return {
    country_code:$('country').value,
    currency_code:$('currency').value,
    target_income:Number($('targetIncome').value)||0,
    income_goal_period:$('goalPeriod').value,
    skills:selectedChips('skills'),
    platforms:selectedChips('platforms'),
    onboarding_complete:true
  };
}
function applyProfile(p){
  if(p.country_code) $('country').value=p.country_code;
  if(p.currency_code) $('currency').value=p.currency_code;
  $('targetIncome').value=p.target_income||0;
  $('goalPeriod').value=p.income_goal_period||'monthly';
  renderChips('skills',skills,p.skills||[]);
  renderChips('platforms',platforms,p.platforms||[]);
  renderMetrics();
  renderRecommendations();
}
async function cloudProfile(uid){
  if(!uid||!window.SF_SUPABASE)return null;
  const {data,error}=await window.SF_SUPABASE.from('profiles').select('id,display_name,avatar_url,country_code,currency_code,skills,platforms,target_income,income_goal_period,income_preferences,onboarding_complete').eq('id',uid).maybeSingle();
  if(error) throw error;
  return data;
}
async function saveCloud(uid,p){
  if(!uid||!window.SF_SUPABASE)return false;
  const {error}=await window.SF_SUPABASE.from('profiles').upsert({
    id:uid,
    country_code:p.country_code,
    currency_code:p.currency_code,
    skills:p.skills||[],
    platforms:p.platforms||[],
    target_income:p.target_income||0,
    income_goal_period:p.income_goal_period||'monthly',
    onboarding_complete:true,
    updated_at:new Date().toISOString()
  },{onConflict:'id'});
  if(error) throw error;
  return true;
}
function renderMetrics(){
  const p=getProfileFromUI(), plan=readPlan(window.__ULMFLIX_UID);
  const total=plan.reduce((a,x)=>a+(Number(x.target)||0),0);
  $('goalMetric').textContent=money(p.target_income,p.currency_code);
  $('streamMetric').textContent=plan.length;
  $('dataMetric').textContent=window.__ULMFLIX_UID?'Local + Online':'Local';
  const pct=p.target_income?Math.min(100,Math.round(total/p.target_income*100)):0;
  $('progressBar').style.width=pct+'%'; $('progressText').textContent=`${pct}% of target planned (${money(total,p.currency_code)} selected targets)`;
}
function renderRecommendations(){
  const p=getProfileFromUI(), skillsSet=new Set(p.skills||[]), platSet=new Set(p.platforms||[]);
  const list=(window.ULMFLIX_INCOME_OPTIONS||[]).map(o=>{
    let score=0;
    const text=(o.name+' '+o.description+' '+o.category).toLowerCase();
    (p.skills||[]).forEach(s=>{if(text.includes(s.toLowerCase().split(' / ')[0]))score+=3});
    (p.platforms||[]).forEach(s=>{if(text.includes(s.toLowerCase()))score+=2});
    if(o.availability==='Varies by country')score+=0.2;
    return {o,score};
  }).sort((a,b)=>b.score-a.score).slice(0,8);
  const box=$('recommendations');box.innerHTML='';
  list.forEach(({o,score})=>{
    const row=document.createElement('div');row.className='recommendation';
    const left=document.createElement('div');const h=document.createElement('strong');h.textContent=o.name;const ptag=document.createElement('p');ptag.className='muted';ptag.textContent=o.category+' • '+o.availability;left.append(h,ptag);
    const btn=document.createElement('a');btn.className='btn btn-dark';btn.href='income.html';btn.textContent=score>2?'Strong match':'Explore';
    row.append(left,btn);box.append(row);
  });
}
async function init(){
  fillSelect('country',countries); fillSelect('currency',currencies);
  const lp=localProfile(); applyProfile(lp);
  let uid=null;
  try{uid=await userId()}catch{}
  window.__ULMFLIX_UID=uid;
  if(uid){
    $('authNotice').textContent='Signed in. Your cloud profile is protected by Supabase Row Level Security and linked to your account.';
    try{
      const cp=await cloudProfile(uid); if(cp){saveLocal({...lp,target_income:cp.target_income,currency_code:cp.currency_code,country_code:cp.country_code,income_goal_period:cp.income_goal_period,skills:cp.skills||[],platforms:cp.platforms||[],onboarding_complete:cp.onboarding_complete});applyProfile(cp)}
    }catch(e){$('authNotice').textContent='Online profile could not be loaded. Your local profile remains available.'}
  }else{
    $('authNotice').textContent='You are using Local Mode. Sign in to securely sync this profile and income plan to your own account.';
  }

  $('saveProfile').onclick=async()=>{
    const p=getProfileFromUI();saveLocal(p);renderMetrics();renderRecommendations();
    if(uid){try{await saveCloud(uid,p);$('authNotice').textContent='Profile saved locally and securely synced online.'}catch(e){$('authNotice').textContent='Saved locally. Cloud sync failed; your local copy is safe.'}}
    else $('authNotice').textContent='Profile saved locally. Sign in to enable secure cloud sync.';
  };
  $('syncNow').onclick=async()=>{
    if(!uid){$('authNotice').textContent='Sign in first to enable secure online sync.';return}
    try{await saveCloud(uid,getProfileFromUI());$('authNotice').textContent='Profile synced online.'}catch(e){$('authNotice').textContent='Cloud sync unavailable right now.'}
  };
  $('exportProfile').onclick=()=>{
    const blob=new Blob([JSON.stringify({app:'ULMFlix',type:'global-profile',version:1,exportedAt:new Date().toISOString(),profile:getProfileFromUI()},null,2)],{type:'application/json'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='ulmflix-global-income-profile.json';a.click();URL.revokeObjectURL(a.href);
  };
  ['country','currency','targetIncome','goalPeriod'].forEach(id=>$(id).addEventListener('change',()=>{renderMetrics();renderRecommendations()}));
  renderMetrics();renderRecommendations();
}
document.addEventListener('DOMContentLoaded',init);
})();