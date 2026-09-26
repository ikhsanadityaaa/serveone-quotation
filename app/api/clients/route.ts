import {NextRequest,NextResponse} from 'next/server';
import {getSupabaseServerClient} from '@/lib/supabase-server';
export const runtime='nodejs';

type AttentionInput={id?:string;name:string;active?:boolean};
type BatchRow={client?:string;address?:string;attention?:string;active?:boolean};
const clean=(v:unknown)=>String(v??'').trim();
const norm=(v:unknown)=>clean(v).toLocaleLowerCase();
const alpha=(a:string,b:string)=>a.localeCompare(b,undefined,{sensitivity:'base'});

export async function GET(){
 try{
  const sb=getSupabaseServerClient();
  const {data:rows,error}=await sb.from('member_directory').select('id,member_name,op_unit_name,address,active').order('op_unit_name').order('member_name').limit(20000);
  if(error)throw error;
  const groups=new Map<string,{client:string;address:string;active:boolean;attentions:{id:string;name:string;active:boolean}[]}>();
  for(const r of rows||[]){
   const client=clean(r.op_unit_name);if(!client)continue;
   const key=norm(client);let g=groups.get(key);
   if(!g){g={client,address:clean(r.address),active:true,attentions:[]};groups.set(key,g)}
   if(!g.address&&clean(r.address))g.address=clean(r.address);
   const att=clean(r.member_name);if(att)g.attentions.push({id:r.id,name:att,active:r.active!==false});
  }
  const out=[...groups.values()].map(g=>({...g,active:g.attentions.some(a=>a.active),attentions:g.attentions.sort((a,b)=>alpha(a.name,b.name))})).sort((a,b)=>alpha(a.client,b.client));
  return NextResponse.json(out);
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Failed to load clients'},{status:500})}
}

async function saveClient(body:any,originalClient?:string){
 const sb=getSupabaseServerClient();
 const client=clean(body.client),address=clean(body.address),attentions=(body.attentions||[]) as AttentionInput[];
 if(!client)throw new Error('Client is required.');
 const unique=new Map<string,AttentionInput>();
 for(const a of attentions.slice(0,100)){const name=clean(a.name);if(name&&!unique.has(norm(name)))unique.set(norm(name),{...a,name})}
 if(!unique.size)throw new Error('At least one Attention is required.');
 const key=originalClient||client;
 const {data:existing,error:ee}=await sb.from('member_directory').select('id,member_name').eq('op_unit_name',key);if(ee)throw ee;
 const byId=new Map<string,any>((existing||[]).map((x:any)=>[x.id,x]));
 const keepIds=new Set<string>();
 const updates:any[]=[];const inserts:any[]=[];const stamp=new Date().toISOString();
 for(const a of unique.values()){
  const payload={member_name:a.name,op_unit_name:client,client_name:client,address,active:a.active!==false,updated_at:stamp};
  if(a.id&&byId.has(a.id)){updates.push({id:a.id,...payload});keepIds.add(a.id);continue}
  const same=(existing||[]).find((x:any)=>norm(x.member_name)===norm(a.name));
  if(same){updates.push({id:same.id,...payload});keepIds.add(same.id)}else inserts.push(payload);
 }
 if(updates.length){const {error}=await sb.from('member_directory').upsert(updates,{onConflict:'id'});if(error)throw error}
 if(inserts.length){const {data,error}=await sb.from('member_directory').insert(inserts).select('id');if(error)throw error;(data||[]).forEach((x:any)=>keepIds.add(x.id))}
 const removed=[...byId.keys()].filter(id=>!keepIds.has(id));if(removed.length){const {error}=await sb.from('member_directory').delete().in('id',removed);if(error)throw error}
 return {ok:true};
}

async function batchAdd(rows:BatchRow[]){
 const sb=getSupabaseServerClient();
 const cleaned=(rows||[]).slice(0,5000).map(r=>({client:clean(r.client),address:clean(r.address),attention:clean(r.attention),active:r.active!==false})).filter(r=>r.client&&r.attention);
 if(!cleaned.length)throw new Error('Paste at least one Client + Attention row.');
 const {data:existing,error}=await sb.from('member_directory').select('id,op_unit_name,member_name,address,active').limit(20000);if(error)throw error;
 const byClient=new Map<string,any[]>();
 for(const row of existing||[]){const key=norm(row.op_unit_name);const arr=byClient.get(key)||[];arr.push(row);byClient.set(key,arr)}
 const grouped=new Map<string,{client:string;address:string;rows:typeof cleaned}>();
 for(const r of cleaned){const key=norm(r.client);const g=grouped.get(key)||{client:r.client,address:r.address,rows:[]};if(!g.address&&r.address)g.address=r.address;g.rows.push(r);grouped.set(key,g)}
 const updates:any[]=[];const inserts:any[]=[];let skipped=0;const stamp=new Date().toISOString();
 for(const group of grouped.values()){
  const old=byClient.get(norm(group.client))||[];
  const canonical=old[0]?.op_unit_name||group.client;
  const address=group.address||clean(old.find((x:any)=>clean(x.address))?.address);
  const seen=new Set(old.map((x:any)=>norm(x.member_name)).filter(Boolean));
  if(old.length&&address){for(const x of old){if(clean(x.address)!==address)updates.push({id:x.id,member_name:x.member_name,op_unit_name:canonical,client_name:canonical,address,active:x.active!==false,updated_at:stamp})}}
  for(const r of group.rows){const k=norm(r.attention);if(!k||seen.has(k)){skipped++;continue}inserts.push({member_name:r.attention,op_unit_name:canonical,client_name:canonical,address,active:r.active!==false,updated_at:stamp});seen.add(k)}
 }
 if(updates.length){for(let i=0;i<updates.length;i+=1000){const {error:e}=await sb.from('member_directory').upsert(updates.slice(i,i+1000),{onConflict:'id'});if(e)throw e}}
 if(inserts.length){for(let i=0;i<inserts.length;i+=1000){const {error:e}=await sb.from('member_directory').insert(inserts.slice(i,i+1000));if(e)throw e}}
 return {ok:true,inserted:inserts.length,updated:updates.length,skipped};
}

export async function POST(req:NextRequest){try{const body=await req.json();if(Array.isArray(body.batch))return NextResponse.json(await batchAdd(body.batch));return NextResponse.json(await saveClient(body))}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Failed to add client'},{status:400})}}
export async function PATCH(req:NextRequest){try{const body=await req.json();return NextResponse.json(await saveClient(body,body.originalClient))}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Failed to save client'},{status:400})}}
export async function DELETE(req:NextRequest){try{const {client}=await req.json();const name=clean(client);if(!name)throw new Error('Missing client');const sb=getSupabaseServerClient();const {error}=await sb.from('member_directory').delete().eq('op_unit_name',name);if(error)throw error;return NextResponse.json({ok:true})}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Failed to delete client'},{status:400})}}
