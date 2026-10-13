export default async (req) => {
 const headers={"Content-Type":"application/json","Cache-Control":"no-store"};
 if(req.method!=="POST")return new Response(JSON.stringify({error:"POST required"}),{status:405,headers});
 if(!process.env.OPENAI_API_KEY)return new Response(JSON.stringify({error:"Missing server API key"}),{status:503,headers});
 try{
 const body=await req.json();
 const category=String(body.category||"General").slice(0,50);
 const messages=(Array.isArray(body.messages)?body.messages:[]).slice(-16).filter(m=>["user","assistant"].includes(m.role)&&typeof m.content==="string").map(m=>({role:m.role,content:m.content.slice(0,1600)}));
 if(!messages.length)return new Response(JSON.stringify({error:"Describe a project first"}),{status:400,headers});
 const system=`You are BidCraft Smart Scope for trade ${category}. Ask one useful follow-up question at a time to clarify a home service request. Create a structured scope from known facts, never invent facts or prices. Mention unknown measurements, photos, materials, access, urgency. If there is gas smell, fire, live electrical danger, structural danger, major flooding, tell user to seek appropriate emergency assistance; don't instruct unsafe DIY. Return JSON ONLY with keys reply (string), scope (string), missing (array of strings), ready (boolean), path (one of Instant Bid, Field Verification, Get It Done). Do not request entry codes. Do not diagnose. Only mark ready if reasonably scoped for preliminary vendor assessment.`;
 const r=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:'gpt-4.1-mini',response_format:{type:'json_object'},messages:[{role:'system',content:system},...messages]})});
 const j=await r.json();if(!r.ok)return new Response(JSON.stringify({error:j.error?.message||'AI request failed'}),{status:502,headers});
 const result=JSON.parse(j.choices[0].message.content);return new Response(JSON.stringify(result),{headers});
 }catch(e){return new Response(JSON.stringify({error:'Server request failed'}),{status:500,headers})}
};
export const config={path:'/api/ai'};
