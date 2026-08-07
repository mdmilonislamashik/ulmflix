document.addEventListener("click",e=>{
  const btn=e.target.closest("[data-save]");if(!btn)return;
  const id=Number(btn.dataset.save);
  const card=btn.closest(".card");
  const movie={id,title:card.querySelector(".card-title").textContent,poster_path:null};
  const added=SFStore.toggle("streamflix_watchlist",movie);
  btn.classList.toggle("active",added);
});
