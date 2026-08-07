(function(){
  const id=window.ULMFLIX_CONFIG?.GA_MEASUREMENT_ID; if(!id)return;
  window.dataLayer=window.dataLayer||[]; window.gtag=function(){dataLayer.push(arguments)}; window.gtag("js",new Date()); window.gtag("config",id,{anonymize_ip:true});
  const s=document.createElement("script"); s.async=true; s.src="https://www.googletagmanager.com/gtag/js?id="+encodeURIComponent(id); document.head.appendChild(s);
})();
