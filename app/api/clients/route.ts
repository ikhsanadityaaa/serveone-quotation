import {NextRequest,NextResponse} from 'next/server';
import {getSupabaseServerClient} from '@/lib/supabase-server';
export const runtime='nodejs';

type AttentionInput={id?:string;name:string;address:string;active?:boolean};
const clean=(v:unknown)=>String(v||'').trim();

async function codeMap(){const sb=getSupabaseServerClient();const {data,error}=await sb.from('client_code_registry').select('*');if(error)throw error;return new Map((data||[]).map((x:any)=>[x.client_name,x.client_code]));}

export async function GET(){
 try{
  const sb=getSupabaseServerClient();
  const [{data:rows,error},codes]=await Promise.all([sb.from('member_directory').select('*').order('op_unit_name').order('member_name').limit(10000),codeMap()]);
  if(error)throw error;
  const groups=new Map<string,any>();
  for(const r of rows||[]){const client=clean(r.op_unit_name);if(!client)continue;let g=groups.get(client);if(!g){g={client,code:codes.get(client)||codes.get(r.client_name)||'',active:true,attentions:[]};groups.set(client,g)}g.attentions.push({id:r.id,name:r.member_name||'',address:r.address||'',active:r.active!==false})}
  const out=[...groups.values()].map(g=>({...g,attentions:g.attentions.sort((a:any,b:any)=>a.name.localeCompare(b.name,undefined,{sensitivity:'base'}))})).sort((a,b)=>a.client.localeCompare(b.client,undefined,{sensitivity:'base'}));
  return NextResponse.json(out);
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Failed to load clients'},{status:500})}
}

async function saveClient(body:any, originalClient?:string){
 const sb=getSupabaseServerClient();const client=clean(body.client),code=clean(body.code).toUpperCase();const attentions=(body.attentions||[]) as AttentionInput[];
 if(!client)throw new Error('Client is required.');if(!code)throw new Error('Client Code is required.');
 const {data:conflict}=await sb.from('client_code_registry').select('client_name').eq('client_code',code).maybeSingle();
 if(conflict&&![client,originalClient].filter(Boolean).includes(conflict.client_name))throw new Error(`Client Code ${code} is already used by ${conflict.client_name}.`);
 const key=originalClient||client;
 const {data:existing,error:ee}=await sb.from('member_directory').select('id').eq('op_unit_name',key);if(ee)throw ee;
 const existingIds=new Set((existing||[]).map((x:any)=>x.id));const keepIds=new Set<string>();
 for(const a of attentions.slice(0,100)){
  const name=clean(a.name);if(!name)continue;const payload={member_name:name,op_unit_name:client,client_name:client,address:clean(a.address),active:a.active!==false,updated_at:new Date().toISOString()};
  if(a.id&&existingIds.has(a.id)){const {error}=await sb.from('member_directory').update(payload).eq('id',a.id);if(error)throw error;keepIds.add(a.id)}
  else{const {data,error}=await sb.from('member_directory').insert(payload).select('id').single();if(error)throw error;keepIds.add(data.id)}
 }
 const removed=[...existingIds].filter(id=>!keepIds.has(id));if(removed.length){const {error}=await sb.from('member_directory').delete().in('id',removed);if(error)throw error}
 const {error:ce}=await sb.from('client_code_registry').upsert({client_name:client,client_code:code,updated_at:new Date().toISOString()},{onConflict:'client_name'});if(ce)throw ce;
 if(originalClient&&originalClient!==client){await sb.from('client_code_registry').delete().eq('client_name',originalClient)}
 return {ok:true};
}

export async function POST(req:NextRequest){try{return NextResponse.json(await saveClient(await req.json()))}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Failed to add client'},{status:400})}}
export async function PATCH(req:NextRequest){try{const b=await req.json();return NextResponse.json(await saveClient(b,b.originalClient))}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Failed to save client'},{status:400})}}
export async function DELETE(req:NextRequest){try{const {client}=await req.json();const name=clean(client);if(!name)throw new Error('Missing client');const sb=getSupabaseServerClient();const {error}=await sb.from('member_directory').delete().eq('op_unit_name',name);if(error)throw error;await sb.from('client_code_registry').delete().eq('client_name',name);return NextResponse.json({ok:true})}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Failed to delete client'},{status:400})}}
