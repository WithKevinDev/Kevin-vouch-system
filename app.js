const DEMO_VOUCHES = [
 {id:"d1",name:"NovaK",rating:5,message:"Super smooth transaction, quick replies and everything was exactly as described. Legit!",time:"2 min ago",verified:true,demo:true,reactions:{heart:24,fire:18,thumb:12}},
 {id:"d2",name:"milo.exe",rating:5,message:"Fast delivery and great communication throughout. Would buy again, no hesitation.",time:"18 min ago",verified:true,demo:true,reactions:{heart:19,fire:13,thumb:9}},
 {id:"d3",name:"itsJay",rating:5,message:"Really good service. Answered all my questions and kept me updated. 10/10 experience.",time:"42 min ago",verified:true,demo:true,reactions:{heart:16,fire:11,thumb:7}},
 {id:"d4",name:"Kira",rating:4,message:"Everything went well and the process was easy. Appreciate the quick support!",time:"1 hr ago",verified:false,demo:true,reactions:{heart:12,fire:5,thumb:8}},
 {id:"d5",name:"zenn",rating:5,message:"No issues at all, exactly what I needed. Friendly, fast and reliable.",time:"3 hrs ago",verified:true,demo:true,reactions:{heart:31,fire:20,thumb:15}},
 {id:"d6",name:"pixelz",rating:5,message:"Legit seller and a clean experience from start to finish. Definitely recommend.",time:"5 hrs ago",verified:true,demo:true,reactions:{heart:14,fire:8,thumb:10}}
];
const STORAGE_KEY = "kevin-vouches-v1";
const blockedWords = ["nigger","faggot","kys","retard"];
const linkPattern = /(?:https?:\/\/|www\.|discord\.gg\/|t\.me\/|bit\.ly\/|[a-z0-9-]+\.(?:com|net|org|gg|io|xyz|ru|me|co)\b)/i;
let vouches = loadVouches();
let activeFilter = "all";
let searchTerm = "";
let sortMode = "newest";
const reactionGlyphs = {heart:"♥",fire:"🔥",thumb:"👍"};

function loadVouches(){
  try { const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)); if(Array.isArray(stored)) return stored; } catch(e){}
  return DEMO_VOUCHES.map(v=>({...v,reactions:{...v.reactions}}));
}
function persist(){ try{localStorage.setItem(STORAGE_KEY,JSON.stringify(vouches));}catch(e){} }
function safeText(value){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function stars(n){return "★".repeat(n)+"☆".repeat(5-n);}
function totalReactions(v){return Object.values(v.reactions||{}).reduce((a,b)=>a+b,0);}
function render(){
 const list=document.querySelector("#vouch-list"); if(!list)return;
 let shown=vouches.filter(v=>{
  const text=(v.name+" "+v.message).toLowerCase();
  if(searchTerm&&!text.includes(searchTerm))return false;
  if(activeFilter==="positive"&&v.rating<4)return false;
  if(activeFilter==="verified"&&!v.verified)return false;
  return true;
 });
 if(sortMode==="liked")shown.sort((a,b)=>totalReactions(b)-totalReactions(a));
 else shown.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
 document.querySelector("#filter-count").textContent=shown.length;
 list.innerHTML=shown.length?shown.map((v,i)=>`
 <article class="vouch-card" style="animation-delay:${Math.min(i,8)*45}ms">
  <div class="vouch-top"><div class="user-avatar">${safeText((v.name||"?").slice(0,1).toUpperCase())}</div><div class="user-info"><b>${safeText(v.name)}</b><small>${v.verified?'<span class="verified">✓ Verified purchase</span>':'Community feedback'}${v.demo?' · <span>Demo</span>':''}</small></div><span class="card-time">${safeText(v.time||"Recently")}</span></div>
  <div class="stars" aria-label="${v.rating} out of 5 stars">${stars(v.rating)}</div>
  <p class="vouch-message">${safeText(v.message)}</p>
  <div class="vouch-bottom"><span class="vouch-label">${v.demo?"SAMPLE VOUCH":"COMMUNITY VOUCH"}</span><div class="reactions">${Object.keys(reactionGlyphs).map(k=>`<button class="reaction ${hasReacted(v.id,k)?"selected":""}" data-react="${k}" data-id="${safeText(v.id)}" aria-label="React with ${k}">${reactionGlyphs[k]} <span>${(v.reactions&&v.reactions[k])||0}</span></button>`).join("")}</div></div>
 </article>`).join(""):'<div class="empty-state">No vouches found. Try another search or filter.</div>';
 const total=vouches.length;
 const positive=total?vouches.filter(v=>v.rating>=4).length/total*100:0;
 document.querySelector("#stat-total").textContent=total.toLocaleString();
 document.querySelector("#stat-positive").textContent=positive.toFixed(1)+"%";
 document.querySelector("#stat-customers").textContent=vouches.filter(v=>v.verified&&!v.demo).length.toLocaleString();
 document.querySelector("#happy-count").textContent=(vouches.filter(v=>v.verified&&!v.demo).length)+"+";
}
function hasReacted(id,k){try{return JSON.parse(localStorage.getItem("vanta-reacted")||"{}")[id+"_"+k]===true}catch(e){return false}}
function setReacted(id,k,val){let o={};try{o=JSON.parse(localStorage.getItem("vanta-reacted")||"{}")}catch(e){}o[id+"_"+k]=val;localStorage.setItem("vanta-reacted",JSON.stringify(o))}
document.querySelector("#search").addEventListener("input",e=>{searchTerm=e.target.value.trim().toLowerCase();render()});
document.querySelector("#sort").addEventListener("change",e=>{sortMode=e.target.value;render()});
document.querySelectorAll(".filter").forEach(btn=>btn.addEventListener("click",()=>{document.querySelectorAll(".filter").forEach(b=>b.classList.remove("active"));btn.classList.add("active");activeFilter=btn.dataset.filter;render()}));
document.querySelector("#vouch-list").addEventListener("click",async e=>{
 const btn=e.target.closest("[data-react]");if(!btn)return;
 const id=btn.dataset.id,k=btn.dataset.react;
 if(hasReacted(id,k))return;
 const v=vouches.find(x=>x.id===id);if(!v)return;
 v.reactions[k]=(v.reactions[k]||0)+1;setReacted(id,k,true);persist();render();
 try{await fetch("/api/react",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,reaction:k})})}catch(e){}
});
function validateSubmission(name,message){
 if(name.length<2||name.length>24)return "Name must be 2–24 characters.";
 if(!/^[\p{L}\p{N}_ .-]+$/u.test(name))return "Name can only use letters, numbers, spaces, dots, underscores, and hyphens.";
 if(linkPattern.test(name)||linkPattern.test(message))return "Links aren't allowed in names or vouches.";
 if(blockedWords.some(w=>(name+" "+message).toLowerCase().includes(w)))return "Please remove inappropriate language.";
 if(/(.)\1{7,}/i.test(message)||/(.)\1{5,}/i.test(name))return "Please avoid repeated characters or spam.";
 if(message.trim().length<8||message.length>400)return "Vouch must be 8–400 characters.";
 return "";
}
document.querySelector("#vouch-form").addEventListener("submit",async e=>{
 e.preventDefault();const form=e.currentTarget,status=document.querySelector("#form-status");
 const name=form.elements.name.value.trim(),message=form.elements.message.value.trim(),rating=Number(form.elements.rating.value);
 const problem=validateSubmission(name,message);
 if(problem){status.textContent=problem;status.className="form-status error";return;}
 const v={id:"local_"+crypto.randomUUID(),name,message,rating,verified:false,demo:false,time:"Just now",createdAt:Date.now(),reactions:{heart:0,fire:0,thumb:0},pending:true};
 status.textContent="Submitting…";status.className="form-status";
 try{
  const res=await fetch("/api/vouches",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,message,rating})});
  if(res.ok){const data=await res.json();if(data.vouch){v.id=data.vouch.id;vouches.unshift(data.vouch)}else vouches.unshift(v)}
  else if(res.status!==404){const data=await res.json().catch(()=>({}));throw new Error(data.error||"Submission could not be accepted.");}
  else vouches.unshift(v);
 }catch(err){
  if(err.message!=="Failed to fetch"&&err.message!=="Submission could not be accepted."){status.textContent=err.message;status.className="form-status error";return;}
  if(location.protocol!=="file:"&&err.message!=="Failed to fetch"){status.textContent=err.message;status.className="form-status error";return;}
  vouches.unshift(v);
 }
 persist();render();form.reset();status.textContent="Thanks! Your vouch was saved locally or sent for moderation.";status.className="form-status success";
});
document.querySelector("#year").textContent=new Date().getFullYear();
render();
