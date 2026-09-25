import {NextRequest,NextResponse} from 'next/server';
import {getSupabaseServerClient} from '@/lib/supabase-server';
export const runtime='nodejs';

async function withCodes(rows:any[]){
  const sb=getSupabaseServerClient();
  const names=[...new Set(rows.map(r=>r.client_name).filter(Boolean))];
  if(!names.length)return rows.map(r=>({...r,client_code:''}));
  const {data,error}=await sb.from('client_code_registry').select('*').in('client_name',names);
  if(error)throw error;
  const m=new Map((data||[]).map((x:any)=>[x.client_name,x.client_code]));
  return rows.map(r=>({...r,client_code:m.get(r.client_name)||''}));
}

export async function GET(req:NextRequest){
  try{
    const sb=getSupabaseServerClient(); const q=(req.nextUrl.searchParams.get('q')||'').trim();
    let query=sb.from('member_directory').select('*').order('client_name').order('op_unit_name').order('member_name').limit(5000);
    if(q)query=query.or(`member_name.ilike.%${q}%,op_unit_name.ilike.%${q}%,client_name.ilike.%${q}%,address.ilike.%${q}%`);
    const {data,error}=await query;if(error)throw error;return NextResponse.json(await withCodes(data||[]));
  }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Failed to load member database'},{status:500})}
}

export async function POST(req:NextRequest){
  try{
    const body=await req.json(); const row=body.row||{}; const sb=getSupabaseServerClient();
    const payload={mem_id:String(row.mem_id||'').trim()||null,member_name:String(row.member_name||'').trim(),op_unit_id:String(row.op_unit_id||'').trim()||null,op_unit_name:String(row.op_unit_name||'').trim(),client_id_external:String(row.client_id_external||'').trim()||null,client_name:String(row.client_name||'').trim(),address:String(row.address||'').trim(),active:row.active!==false,updated_at:new Date().toISOString()};
    const code=String(row.client_code||'').trim().toUpperCase();
    if(!payload.member_name||!payload.op_unit_name||!payload.client_name)throw new Error('Client, Attention, and Client Nm are required.');
    if(!code)throw new Error('Client Code is required.');
    const {data:conflict}=await sb.from('client_code_registry').select('client_name').eq('client_code',code).neq('client_name',payload.client_name).maybeSingle();
    if(conflict)throw new Error(`Client Code ${code} is already used by ${conflict.client_name}.`);
    const {error:ce}=await sb.from('client_code_registry').upsert({client_name:payload.client_name,client_code:code,updated_at:new Date().toISOString()},{onConflict:'client_name'});if(ce)throw ce;
    const {data,error}=await sb.from('member_directory').insert(payload).select().single();if(error)throw error;return NextResponse.json({...data,client_code:code});
  }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Failed to add member'},{status:400})}
}

export async function PATCH(req:NextRequest){
  try{
    const {row}=await req.json(); if(!row?.id)throw new Error('Missing row id'); const sb=getSupabaseServerClient();
    const payload={member_name:String(row.member_name||'').trim(),op_unit_name:String(row.op_unit_name||'').trim(),client_name:String(row.client_name||'').trim(),address:String(row.address||'').trim(),active:row.active!==false,updated_at:new Date().toISOString()};
    const code=String(row.client_code||'').trim().toUpperCase(); if(!code)throw new Error('Client Code is required.');
    const {data:conflict}=await sb.from('client_code_registry').select('client_name').eq('client_code',code).neq('client_name',payload.client_name).maybeSingle();if(conflict)throw new Error(`Client Code ${code} is already used by ${conflict.client_name}.`);
    const {error:ce}=await sb.from('client_code_registry').upsert({client_name:payload.client_name,client_code:code,updated_at:new Date().toISOString()},{onConflict:'client_name'});if(ce)throw ce;
    const {data,error}=await sb.from('member_directory').update(payload).eq('id',row.id).select().single();if(error)throw error;return NextResponse.json({...data,client_code:code});
  }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Failed to save member'},{status:400})}
}

export async function DELETE(req:NextRequest){try{const {id}=await req.json();const sb=getSupabaseServerClient();const {error}=await sb.from('member_directory').delete().eq('id',id);if(error)throw error;return NextResponse.json({ok:true})}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Failed to delete member'},{status:400})}}
