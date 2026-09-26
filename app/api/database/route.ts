import {NextRequest,NextResponse} from 'next/server';
import {getSupabaseServerClient} from '@/lib/supabase-server';
export const runtime='nodejs';

const tables:any={sales:'sales_people',directors:'directors'};
const clean=(v:unknown)=>String(v??'').trim();
const norm=(v:unknown)=>clean(v).toLocaleLowerCase();
function table(entity:string){const t=tables[entity];if(!t)throw new Error('Invalid database entity');return t}

async function saveSalesBatch(rows:any[]){
 const sb=getSupabaseServerClient();
 const cleaned=(rows||[]).slice(0,5000).map(r=>({id:r.id||undefined,name:clean(r.name),email:clean(r.email),phone:clean(r.phone),active:r.active!==false})).filter(r=>r.name&&r.email&&r.phone);
 if(!cleaned.length)throw new Error('Paste at least one complete Sales PIC row.');
 const {data:existing,error}=await sb.from('sales_people').select('id,name,email,phone,active').order('name').limit(10000);if(error)throw error;
 const byId=new Map<string,any>((existing||[]).map((x:any)=>[x.id,x]));
 const byName=new Map<string,any>((existing||[]).map((x:any)=>[norm(x.name),x]));
 const incoming=new Map<string,any>();
 for(const r of cleaned)incoming.set(norm(r.name),r); // last pasted row wins for the same name
 const updates:any[]=[];const inserts:any[]=[];let skipped=cleaned.length-incoming.size;
 for(const row of incoming.values()){
  const old=(row.id&&byId.get(row.id))||byName.get(norm(row.name));
  if(old)updates.push({id:old.id,name:row.name,email:row.email,phone:row.phone,active:row.active});
  else inserts.push({name:row.name,email:row.email,phone:row.phone,active:row.active});
 }
 if(updates.length){for(let i=0;i<updates.length;i+=1000){const {error:e}=await sb.from('sales_people').upsert(updates.slice(i,i+1000),{onConflict:'id'});if(e)throw e}}
 if(inserts.length){for(let i=0;i<inserts.length;i+=1000){const {error:e}=await sb.from('sales_people').insert(inserts.slice(i,i+1000));if(e)throw e}}
 const {data:all,error:allErr}=await sb.from('sales_people').select('*').order('name').limit(10000);if(allErr)throw allErr;
 return {ok:true,inserted:inserts.length,updated:updates.length,skipped,rows:all||[]};
}

export async function GET(req:NextRequest){
 try{const e=req.nextUrl.searchParams.get('entity')||'';const sb=getSupabaseServerClient();let q=sb.from(table(e)).select('*').order('name');const {data,error}=await q;if(error)throw error;return NextResponse.json(data||[])}
 catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Failed'},{status:400})}
}

export async function POST(req:NextRequest){
 try{
  const body=await req.json();const {entity,row,rows}=body;
  if(entity==='sales'&&Array.isArray(rows))return NextResponse.json(await saveSalesBatch(rows));
  const sb=getSupabaseServerClient();const payload={...row};delete payload.id;
  const {data,error}=await sb.from(table(entity)).insert(payload).select().single();if(error)throw error;return NextResponse.json(data);
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Failed'},{status:400})}
}

export async function PATCH(req:NextRequest){
 try{const {entity,row}=await req.json();if(!row?.id)throw new Error('Missing id');const sb=getSupabaseServerClient();const payload={...row};delete payload.id;delete payload.created_at;const {data,error}=await sb.from(table(entity)).update(payload).eq('id',row.id).select().single();if(error)throw error;return NextResponse.json(data)}
 catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Failed'},{status:400})}
}

export async function DELETE(req:NextRequest){
 try{const {entity,id}=await req.json();const sb=getSupabaseServerClient();const {error}=await sb.from(table(entity)).delete().eq('id',id);if(error)throw error;return NextResponse.json({ok:true})}
 catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Failed'},{status:400})}
}
