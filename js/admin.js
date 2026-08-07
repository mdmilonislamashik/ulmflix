document.addEventListener("DOMContentLoaded",()=>{
  const list=document.getElementById("adminMovies");if(!list)return;
  const items=SFStore.get("admin_movies",[]);
  list.innerHTML=items.length?items.map(x=>`<tr><td>${SF.escape(x.title)}</td><td>${SF.escape(x.genre||"")}</td><td>${SF.escape(x.video||"")}</td></tr>`).join(""):'<tr><td colspan="3">No custom movies added.</td></tr>';
});
