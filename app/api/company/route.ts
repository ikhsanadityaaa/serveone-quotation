import {NextRequest,NextResponse} from 'next/server';
import {getSupabaseServerClient} from '@/lib/supabase-server';
import {COMPANY_ADDRESS} from '@/lib/constants';
export const runtime='nodejs';

export async function GET(){
 try{
  const sb=getSupabaseServerClient();
  const {data,error}=await sb.from('app_settings').select('value').eq('key','company_address').maybeSingle();
  if(error)throw error;
  return NextResponse.json({companyAddress:String(data?.value||COMPANY_ADDRESS)});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Failed to load company address'},{status:500})}
}

export async function PATCH(req:NextRequest){
 try{
  const {companyAddress}=await req.json();
  const value=String(companyAddress||'').trim();
  if(!value)throw new Error('Serveone address is required.');
  const sb=getSupabaseServerClient();
  const {data,error}=await sb.from('app_settings').upsert({key:'company_address',value,updated_at:new Date().toISOString()},{onConflict:'key'}).select('value').single();
  if(error){if((error as any).code==='42P01')throw new Error('Run supabase/v24-upgrade.sql once before saving the Serveone address.');throw error}
  return NextResponse.json({ok:true,companyAddress:String(data.value)});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Failed to save company address'},{status:400})}
}
