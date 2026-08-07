(function(){
const data=[['Trending','trendGrid'],['New Releases','newGrid'],['Top 10','topGrid'],['Popular','popularGrid'],['Recommended For You','recGrid'],['Recently Added','recentGrid'],['ULMFlix Originals','originalGrid']];
const sample=[{id:'sample-1',title:'Featured Movie',genre:'Drama',year:'2026',rating:'8.7',poster:'/assets/images/placeholder-action.svg'},{id:'sample-2',title:'Action Night',genre:'Action',year:'2026',rating:'8.2',poster:'/assets/images/placeholder-action.svg'},{id:'sample-3',title:'The Series',genre:'Series',year:'2025',rating:'9.0',poster:'/assets/images/placeholder-action.svg'}];
function get(){try{const a=JSON.parse(localStorage.getItem('sf_admin_movies')||'[]');if(a.length)return Promise.resolve(a)}catch(e){} if(window.SFAPI?.getMovies)return window.SFAPI.getMovies().catch(()=>sample);return Promise.resolve(sample)}
function card(m){return `<article class="card"><a class="poster-link" href="details.html?id=${encodeURIComponent(m.id||m.title)}"><img class="poster" src="${m.poster||m.image||'/assets/images/placeholder-action.svg'}" alt="${m.title||'Movie'}" loading="lazy"><span class="movie-rating">★ ${m.rating||'N/A'}</span></a><div class="card-body"><div class="card-title">${m.title||'Untitled'}</div><div class="meta">${m.genre||m.category||'Movie'} • ${m.year||''}</div></div></article>`}
get().then(ms=>data.forEach(([,id],i)=>{const el=document.getElementById(id);if(el)el.innerHTML=ms.slice(i%Math.max(1,ms.length),Math.min(ms.length,(i%3)+10)).map(card).join('')||'<div class="status">No titles yet.</div>';}));
})();

