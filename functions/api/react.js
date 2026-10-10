const headers={"Content-Type":"application/json","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"};
function json(d,s=200){return new Response(JSON.stringify(d),{status:s,headers})}
export async function onRequestPost({request,env}){
 if(!env.DB)return json({error:"Database is not configured."},503);
 const origin=request.headers.get("Origin");if(origin&&new URL(origin).host!==new URL(request.url).host)return json({error:"Origin not allowed."},403);
 let b;try{b=await request.json()}catch{return json({error:"Invalid JSON."},400)}
 if(typeof b.id!=="string"||!["heart","fire","thumb"].includes(b.reaction))return json({error:"Invalid reaction."},400);
 // Production hardening: add Turnstile and a durable per-user/IP reaction deduplication strategy.
 const col={heart:"heart_count",fire:"fire_count",thumb:"thumb_count"}[b.reaction];
 const eventId=crypto.randomUUID();
 try{
  await env.DB.prepare("INSERT INTO reaction_events(id,vouch_id,reaction,created_at) SELECT ?,id,?,? FROM vouches WHERE id=? AND status='approved'").bind(eventId,b.reaction,Date.now(),b.id).run();
  const result=await env.DB.prepare(`UPDATE vouches SET ${col}=${col}+1 WHERE id=? AND status='approved'`).bind(b.id).run();
  if(!result.meta?.changes)return json({error:"Vouch not found."},404);
 }catch(e){return json({error:"Could not save reaction."},400)}
 return json({ok:true});
}
