import {NextRequest,NextResponse} from 'next/server';
import {getSupabaseServerClient} from '@/lib/supabase-server';
export const runtime='nodejs';

const clean=(v:unknown)=>String(v??'').trim();
const norm=(v:unknown)=>clean(v).toLocaleLowerCase();

export async function POST(req:NextRequest){
  try{
    const body=await req.json();
    const client=clean(body.client),name=clean(body.attention),requestedAddress=clean(body.address);
    if(!client)throw new Error('Please select Client first.');
    if(!name)throw new Error('Attention name is required.');
    const sb=getSupabaseServerClient();
    const {data:existing,error}=await sb.from('member_directory').select('id,member_name,op_unit_name,client_name,address,active').eq('op_unit_name',client).limit(5000);
    if(error)throw error;
    const same=(existing||[]).find((x:any)=>norm(x.member_name)===norm(name));
    if(same)return NextResponse.json({ok:true,created:false,member:{...same,client_code:''}});
    const address=requestedAddress||clean((existing||[]).find((x:any)=>clean(x.address))?.address);
    const canonical=clean((existing||[])[0]?.op_unit_name)||client;
    const payload={member_name:name,op_unit_name:canonical,client_name:canonical,address,active:true,updated_at:new Date().toISOString()};
    const {data:inserted,error:insertError}=await sb.from('member_directory').insert(payload).select('id,member_name,op_unit_name,client_name,address,active').single();
    if(insertError)throw insertError;
    return NextResponse.json({ok:true,created:true,member:{...inserted,client_code:''}});
  }catch(e){
    return NextResponse.json({error:e instanceof Error?e.message:'Failed to add Attention'},{status:400});
  }
}
