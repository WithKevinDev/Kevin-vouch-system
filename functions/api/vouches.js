const BAD_WORDS = ["nigger","faggot","kys","retard"];
const LINK_RE = /(?:https?:\/\/|www\.|discord\.gg\/|t\.me\/|bit\.ly\/|[a-z0-9-]+\.(?:com|net|org|gg|io|xyz|ru|me|co)\b)/i;
const cors = {"Content-Type":"application/json","X-Content-Type-Options":"nosniff","Cache-Control":"no-store"};
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:cors})}
function valid(name,message){
 if(typeof name!=="string"||typeof message!=="string")return"Name and message are required.";
 if(name.trim().length<2||name.trim().length>24)return"Name must be 2–24 characters.";
 if(!/^[\p{L}\p{N}_ .-]+$/u.test(name.trim()))return"Name contains unsupported characters.";
 if(message.trim().length<8||message.length>400)return"Message must be 8–400 characters.";
 if(LINK_RE.test(name)||LINK_RE.test(message))return"Links are not allowed.";
 if(BAD_WORDS.some(w=>(name+" "+message).toLowerCase().includes(w)))return"Please remove inappropriate language.";
 if(/(.)\1{7,}/i.test(message)||/(.)\1{5,}/i.test(name))return"Repeated characters are not allowed.";
 return"";
}
export async function onRequestGet({env}){
 if(!env.DB)return json({error:"Database is not configured."},503);
 const {results=[]}=await env.DB.prepare("SELECT id,name,message,rating,verified,demo,created_at,heart_count,fire_count,thumb_count FROM vouches WHERE status='approved' ORDER BY created_at DESC LIMIT 100").all();
 return json({vouches:results.map(row=>({id:row.id,name:row.name,message:row.message,rating:row.rating,verified:!!row.verified,demo:!!row.demo,createdAt:row.created_at,time:relative(row.created_at),reactions:{heart:row.heart_count,fire:row.fire_count,thumb:row.thumb_count}}))});
}
function relative(ts){const mins=Math.max(0,Math.floor((Date.now()-ts)/60000));return mins<1?"Just now":mins<60?`${mins} min ago`:mins<1440?`${Math.floor(mins/60)} hr ago`:`${Math.floor(mins/1440)} days ago`}
export async function onRequestPost({request,env}){
 if(!env.DB)return json({error:"Database is not configured."},503);
 if(!request.headers.get("content-type")?.includes("application/json"))return json({error:"JSON required."},415);
 const origin=request.headers.get("Origin");if(origin&&new URL(origin).host!==new URL(request.url).host)return json({error:"Origin not allowed."},403);
 const ip=request.headers.get("CF-Connecting-IP")||"unknown";
 const now=Date.now();
 // Basic per-IP throttle. For production, also enable Cloudflare WAF rate limiting and Turnstile.
 const count=await env.DB.prepare("SELECT COUNT(*) AS n FROM submission_events WHERE ip_hash=? AND created_at>?").bind(ip,now-10*60*1000).first();
 if((count?.n||0)>=3)return json({error:"Too many submissions. Please try again later."},429);
 let body;try{body=await request.json()}catch{return json({error:"Invalid JSON."},400)}
 const name=body.name?.trim(),message=body.message?.trim(),rating=Number(body.rating),problem=valid(name,message);
 if(problem)return json({error:problem},400);
 if(!Number.isInteger(rating)||rating<1||rating>5)return json({error:"Rating must be from 1 to 5."},400);
 // Public submissions are pending moderation; the admin can approve them after adding a moderation workflow.
 const id=crypto.randomUUID();
 await env.DB.batch([
  env.DB.prepare("INSERT INTO submission_events(ip_hash,created_at) VALUES(?,?)").bind(ip,now),
  env.DB.prepare("INSERT INTO vouches(id,name,message,rating,verified,demo,status,created_at) VALUES(?,?,?,?,0,0,'pending',?)").bind(id,name,message,rating,now)
 ]);
 return json({ok:true,message:"Thanks — your vouch was sent for review.",vouch:{id,name,message,rating,verified:false,demo:false,status:"pending",createdAt:now,time:"Pending review",reactions:{heart:0,fire:0,thumb:0}}},201);
}
