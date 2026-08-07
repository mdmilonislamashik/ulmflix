document.addEventListener("DOMContentLoaded", async () => {
  const set=(id,html)=>{const el=document.getElementById(id);if(el)el.innerHTML=html;};
  try{
    let data=await window.SFCatalog?.published({page:1,limit:24});
    if(!data?.total_results) { const [popular,trending]=await Promise.all([SF.popular(1),SF.trending(1)]); data=popular; window.__tmdbTrending=trending; }
    const items=data.results||[];
    SFComponents.render("homeGrid",items.slice(0,12));
    const trending=window.__tmdbTrending?.results||items;
    SFComponents.render("trendGrid",trending.slice(0,12));
    const featured=items.find(m=>m.featured)||trending[0];
    const hero=document.getElementById("hero");
    if(featured&&hero){hero.style.backgroundImage=`linear-gradient(90deg,rgba(8,8,8,.96),rgba(8,8,8,.58),rgba(8,8,8,.18)),url("${SF.backdrop(featured)}")`;document.getElementById("heroTitle").textContent=featured.title||"Discover Movies";document.getElementById("heroText").textContent=featured.overview||"Explore movies and series on ULMFlix.";const b=document.getElementById("heroDetails");if(b)b.href=`details.html?id=${encodeURIComponent(featured.id)}`;}
  }catch(e){set("homeGrid",`<div class="status">${SF.escape(e.message)}</div>`);set("trendGrid",`<div class="status">${SF.escape(e.message)}</div>`);}
});
