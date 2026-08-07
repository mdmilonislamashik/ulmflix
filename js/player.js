document.addEventListener("DOMContentLoaded",()=>{
    const video=document.getElementById("legalVideo"),url=document.getElementById("videoUrl"),load=document.getElementById("loadVideo");
    if(!video||!url||!load)return;
    load.addEventListener("click",()=>{
        const value=url.value.trim();
        if(!/^https?:\/\/.+/i.test(value)){alert("Please enter a valid legal video URL.");return;}
        video.src=value; video.load(); video.play().catch(()=>{});
    });
});
