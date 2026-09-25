import {NextRequest,NextResponse} from 'next/server';
import {getSupabaseServerClient} from '@/lib/supabase-server';
export const runtime='nodejs';

type AttentionInput={id?:string;name:string;active?:boolean};
type BatchRow={client?:string;address?:string;attention?:string;active?:boolean};
const clean=(v:unknown)=>String(v||'').trim();
const norm=(v:unknown)=>clean(v).toLocaleLowerCase();

export async function GET(){
 try{
  const sb=getSupabaseServerClient();
  const {data:rows,error}=await sb.from('member_directory').select('*').order('op_unit_name').order('member_name').limit(10000);
  if(error)throw error;
  const groups=new Map<string,any>();
  for(const r of rows||[]){
   const client=clean(r.op_unit_name);if(!client)continue;
   const key=norm(client);let g=groups.get(key);
   if(!g){g={client,address:clean(r.address),active:true,attentions:[]};groups.set(key,g)}
   if(!g.address&&clean(r.address))g.address=clean(r.address);
   const att=clean(r.member_name);if(att)g.attentions.push({id:r.id,name:att,active:r.active!==false});
  }
  const alpha=(a:string,b:string)=>a.localeCompare(b,undefined,{sensitivity:'base'});
  const out=[...groups.values()].map(g=>({...g,attentions:g.attentions.sort((a:any,b:any)=>alpha(a.name,b.name))})).sort((a,b)=>alpha(a.client,b.client));
  return NextResponse.json(out);
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Failed to load clients'},{status:500})}
}

async function saveClient(body:any, originalClient?:string){
 const sb=getSupabaseServerClient();const client=clean(body.client),address=clean(body.address);const attentions=(body.attentions||[]) as AttentionInput[];
 if(!client)throw new Error('Client is required.');
 const unique=new Map<string,AttentionInput>();for(const a of attentions.slice(0,100)){const name=clean(a.name);if(name&&!unique.has(norm(name)))unique.set(norm(name),{...a,name})}
 if(!unique.size)throw new Error('At least one Attention is required.');
 const key=originalClient||client;
 const {data:existing,error:ee}=await sb.from('member_directory').select('id,member_name').eq('op_unit_name',key);if(ee)throw ee;
 const byId=new Map((existing||[]).map((x:any)=>[x.id,x]));const keepIds=new Set<string>();
 for(const a of unique.values()){
  const payload={member_name:a.name,op_unit_name:client,client_name:client,address,active:a.active!==false,updated_at:new Date().toISOString()};
  if(a.id&&byId.has(a.id)){const {error}=await sb.from('member_directory').update(payload).eq('id',a.id);if(error)throw error;keepIds.add(a.id)}
  else{
   const same=(existing||[]).find((x:any)=>norm(x.member_name)===norm(a.name));
   if(same){const {error}=await sb.from('member_directory').update(payload).eq('id',same.id);if(error)throw error;keepIds.add(same.id)}
   else{const {data,error}=await sb.from('member_directory').insert(payload).select('id').single();if(error)throw error;keepIds.add(data.id)}
  }
 }
 const removed=[...byId.keys()].filter(id=>!keepIds.has(id));if(removed.length){const {error}=await sb.from('member_directory').delete().in('id',removed);if(error)throw error}
 if(originalClient&&originalClient!==client){await sb.from('client_code_registry').delete().eq('client_name',originalClient)}
 return {ok:true};
}

async function batchAdd(rows:BatchRow[]){
 const sb=getSupabaseServerClient();
 const cleaned=(rows||[]).map(r=>({client:clean(r.client),address:clean(r.address),attention:clean(r.attention),active:r.active!==false})).filter(r=>r.client&&r.attention);
 if(!cleaned.length)throw new Error('Paste at least one Client + Attention row.');
 const {data:existing,error}=await sb.from('member_directory').select('id,op_unit_name,member_name,address,active').limit(10000);if(error)throw error;
 const grouped=new Map<string,{client:string;address:string;rows:BatchRow[]}>();
 for(const r of cleaned){const key=norm(r.client);const g=grouped.get(key)||{client:r.client,address:r.address,rows:[]};if(!g.address&&r.address)g.address=r.address;g.rows.push(r);grouped.set(key,g)}
 let inserted=0,updated=0,skipped=0;
 for(const group of grouped.values()){
  const old=(existing||[]).filter((x:any)=>norm(x.op_unit_name)===norm(group.client));
  const canonical=old[0]?.op_unit_name||group.client;
  const address=group.address||clean(old.find((x:any)=>clean(x.address))?.address);
  const seen=new Set(old.map((x:any)=>norm(x.member_name)).filter(Boolean));
  if(old.length&&address&&old.some((x:any)=>clean(x.address)!==address)){
   const {error:ue}=await sb.from('member_directory').update({address,updated_at:new Date().toISOString()}).eq('op_unit_name',canonical);if(ue)throw ue;updated+=old.length;
  }
  for(const r of group.rows){const k=norm(r.attention);if(!k||seen.has(k)){skipped++;continue}const {error:ie}=await sb.from('member_directory').insert({member_name:r.attention,op_unit_name:canonical,client_name:canonical,address,active:r.active!==false,updated_at:new Date().toISOString()});if(ie)throw ie;seen.add(k);inserted++}
 }
 return {ok:true,inserted,updated,skipped};
}

export async function POST(req:NextRequest){try{const b=await req.json();if(Array.isArray(b.batch))return NextResponse.json(await batchAdd(b.batch));return NextResponse.json(await saveClient(b))}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Failed to add client'},{status:400})}}
export async function PATCH(req:NextRequest){try{const b=await req.json();return NextResponse.json(await saveClient(b,b.originalClient))}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Failed to save client'},{status:400})}}
export async function DELETE(req:NextRequest){try{const {client}=await req.json();const name=clean(client);if(!name)throw new Error('Missing client');const sb=getSupabaseServerClient();const {error}=await sb.from('member_directory').delete().eq('op_unit_name',name);if(error)throw error;await sb.from('client_code_registry').delete().eq('client_name',name);return NextResponse.json({ok:true})}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Failed to delete client'},{status:400})}}
