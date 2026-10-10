const BAD_WORDS=["nigger","faggot","kys","retard"];
const LINK_RE=/(?:https?:\/\/|www\.|discord\.gg\/|t\.me\/|bit\.ly\/|[a-z0-9-]+\.(?:com|net|org|gg|io|xyz|ru|me|co)\b)/i;
const headers={"Content-Type":"application/json","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"};
function json(d,s=200){return new Response(JSON.stringify(d),{status:s,headers})}
function valid(v){if(!v||typeof v.name!=="string"||typeof v.message!=="string")return"Invalid vouch.";if(v.name.trim().length<2||v.name.trim().length>24)return"Name must be 2–24 characters.";if(!/^[\p{L}\p{N}_ .-]+$/u.test(v.name.trim()))return"Invalid name.";if(v.message.trim().length<8||v.message.length>400)return"Message must be 8–400 characters.";if(LINK_RE.test(v.name)||LINK_RE.test(v.message))return"Links are not allowed.";if(BAD_WORDS.some(w=>(v.name+" "+v.message).toLowerCase().includes(w)))return"Inappropriate language.";if(!Number.isInteger(Number(v.rating))||Number(v.rating)<1||Number(v.rating)>5)return"Rating must be 1–5.";return""}
export async function onRequestPost({request,env}){
 if(!env.ADMIN_TOKEN)return json({error:"ADMIN_TOKEN secret is not configured."},503);
 const auth=request.headers.get("Authorization")||"";
 const supplied=auth.startsWith("Bearer ")?auth.slice(7):"";
 if(!constantTimeEqual(supplied,env.ADMIN_TOKEN))return json({error:"Unauthorized."},401);
 if(!env.DB)return json({error:"Database is not configured."},503);
 let b;try{b=await request.json()}catch{return json({error:"Invalid JSON."},400)}
 if(b.action==="auth")return json({ok:true});
 if(b.action==="create"){
  const p=valid(b.vouch);if(p)return json({error:p},400);
  const v=b.vouch,id=crypto.randomUUID(),now=Date.now();
  await env.DB.prepare("INSERT INTO vouches(id,name,message,rating,verified,demo,status,created_at) VALUES(?,?,?,?,?,0,'approved',?)").bind(id,v.name.trim(),v.message.trim(),Number(v.rating),v.verified?1:0,now).run();
  return json({ok:true,vouch:{...v,id,createdAt:now,time:"Just now",demo:false,reactions:{heart:0,fire:0,thumb:0}}},201);
 }
 if(b.action==="bulk_demo"){
  if(!Array.isArray(b.vouches)||b.vouches.length<1||b.vouches.length>25)return json({error:"Provide 1–25 demo entries."},400);
  const now=Date.now(),stmts=[];
  for(const v of b.vouches){const p=valid(v);if(p)return json({error:p},400);stmts.push(env.DB.prepare("INSERT INTO vouches(id,name,message,rating,verified,demo,status,created_at) VALUES(?,?,?,?,0,1,'approved',?)").bind(crypto.randomUUID(),v.name.trim(),v.message.trim(),Number(v.rating),now))}
  await env.DB.batch(stmts);return json({ok:true,count:stmts.length},201);
 }
 if(b.action==="delete"){
  if(typeof b.id!=="string")return json({error:"Invalid id."},400);
  await env.DB.prepare("DELETE FROM vouches WHERE id=?").bind(b.id).run();return json({ok:true});
 }
 return json({error:"Unknown admin action."},400);
}
function constantTimeEqual(a,b){if(typeof a!=="string"||typeof b!=="string")return false;let diff=a.length^b.length;const n=Math.max(a.length,b.length);for(let i=0;i<n;i++)diff|=(a.charCodeAt(i%Math.max(1,a.length))||0)^(b.charCodeAt(i%Math.max(1,b.length))||0);return diff===0}
