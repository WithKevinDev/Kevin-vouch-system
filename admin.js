const ADMIN_KEY="vanta-admin-token";
const demoNames=["sample_guest","DemoBuyer","test_customer","sample_user","ExampleK","demo_member","guest_01","sampleNova","test_vouch","DemoAccount"];
const demoMessages=["Sample review: quick response and a smooth demo transaction.","Demo content only — this entry is for testing the vouch layout.","Example feedback for preview purposes; not a real purchase.","Sample testimonial placeholder. Replace with genuine customer feedback.","Demo vouch: the interface was easy to use and the flow was clear."];
const badWords=["nigger","faggot","kys","retard"];
const linkPattern=/(?:https?:\/\/|www\.|discord\.gg\/|t\.me\/|bit\.ly\/|[a-z0-9-]+\.(?:com|net|org|gg|io|xyz|ru|me|co)\b)/i;
let entries=readEntries();
function readEntries(){try{let a=JSON.parse(localStorage.getItem("vanta-vouches-v1"));return Array.isArray(a)?a:[]}catch(e){return[]}}
function saveEntries(){localStorage.setItem("vanta-vouches-v1",JSON.stringify(entries))}
function escaped(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function validate(n,m){if(n.length<2||n.length>24)return"Name must be 2–24 characters.";if(!/^[\p{L}\p{N}_ .-]+$/u.test(n))return"Name contains unsupported characters.";if(linkPattern.test(n)||linkPattern.test(m))return"Links are not allowed.";if(badWords.some(w=>(n+" "+m).toLowerCase().includes(w)))return"Please remove inappropriate language.";if(m.length<8||m.length>400)return"Text must be 8–400 characters.";return""}
function isAuthed(){return !!sessionStorage.getItem(ADMIN_KEY)}
function showPanel(){document.querySelector("#login-card").classList.toggle("hidden",isAuthed());document.querySelector("#admin-content").classList.toggle("hidden",!isAuthed());if(isAuthed())renderList()}
document.querySelector("#login-btn").addEventListener("click",async()=>{
 const token=document.querySelector("#admin-token").value.trim(),status=document.querySelector("#login-status");
 if(!token){status.textContent="Enter your admin token.";return}
 // Verify against a protected endpoint; never rely on client-side password comparison.
 try{const res=await fetch("/api/admin/vouches",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+token},body:JSON.stringify({action:"auth"})});
 if(res.ok){sessionStorage.setItem(ADMIN_KEY,token);status.textContent="Access granted.";showPanel();return}
 if(res.status===404){status.textContent="Admin API isn't configured yet. Connect Cloudflare Pages Functions and set ADMIN_TOKEN.";return}
 }catch(e){}
 status.textContent="Could not verify token. Check Cloudflare Pages deployment and ADMIN_TOKEN secret.";
});
function renderList(){entries=readEntries();const list=document.querySelector("#admin-list");list.innerHTML=entries.length?entries.slice().reverse().map(v=>`<div class="admin-row"><span><b>${escaped(v.name)}</b> ${v.demo?"· DEMO":""}<br><small>${escaped(v.message.slice(0,105))}</small></span><button data-delete="${escaped(v.id)}">Delete</button></div>`).join(""):'<p class="tiny">No local entries in this browser yet.</p>'}
document.querySelector("#admin-list").addEventListener("click",async e=>{const b=e.target.closest("[data-delete]");if(!b)return;const id=b.dataset.delete;const token=sessionStorage.getItem(ADMIN_KEY);try{await fetch("/api/admin/vouches",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+token},body:JSON.stringify({action:"delete",id})})}catch(e){}entries=readEntries().filter(v=>v.id!==id);saveEntries();renderList()});
document.querySelector("#create-form").addEventListener("submit",async e=>{e.preventDefault();if(!isAuthed())return;const f=e.currentTarget,n=f.elements.name.value.trim(),m=f.elements.message.value.trim(),rating=Number(f.elements.rating.value),verified=f.elements.verified.checked,status=document.querySelector("#create-status"),problem=validate(n,m);if(problem){status.textContent=problem;return}
const v={id:"local_"+crypto.randomUUID(),name:n,message:m,rating,verified,demo:false,time:"Just now",createdAt:Date.now(),reactions:{heart:0,fire:0,thumb:0}};
try{const res=await fetch("/api/admin/vouches",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+sessionStorage.getItem(ADMIN_KEY)},body:JSON.stringify({action:"create",vouch:v})});if(res.ok){const d=await res.json();if(d.vouch)v.id=d.vouch.id;else if(d.ok){status.textContent="Created on server.";}}else if(res.status!==404){status.textContent="Server rejected this action.";return}}catch(e){}
entries=readEntries();entries.push(v);saveEntries();renderList();f.reset();status.textContent="Vouch created in this browser. Connect D1 for shared storage."});
document.querySelector("#bulk-btn").addEventListener("click",async()=>{if(!isAuthed())return;const count=Math.max(1,Math.min(25,Number(document.querySelector("#bulk-count").value)||1));const made=Array.from({length:count},(_,i)=>({id:"demo_"+crypto.randomUUID(),name:demoNames[Math.floor(Math.random()*demoNames.length)]+"_"+(Math.floor(Math.random()*90)+10),message:demoMessages[Math.floor(Math.random()*demoMessages.length)],rating:[4,5,5,5,3][Math.floor(Math.random()*5)],verified:false,demo:true,time:"Sample",createdAt:Date.now()+i,reactions:{heart:0,fire:0,thumb:0}}));
 try{await fetch("/api/admin/vouches",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+sessionStorage.getItem(ADMIN_KEY)},body:JSON.stringify({action:"bulk_demo",vouches:made})})}catch(e){}
 entries=readEntries().concat(made);saveEntries();renderList();document.querySelector("#bulk-status").textContent=`Created ${count} clearly labeled demo samples in this browser.`});
document.querySelector("#logout-btn").addEventListener("click",()=>{sessionStorage.removeItem(ADMIN_KEY);document.querySelector("#admin-token").value="";showPanel()});
document.querySelector("#refresh-btn").addEventListener("click",renderList);
showPanel();
