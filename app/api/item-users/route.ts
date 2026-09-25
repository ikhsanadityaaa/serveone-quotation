import {NextResponse} from 'next/server';
import {getSupabaseServerClient} from '@/lib/supabase-server';
export const runtime='nodejs';
export async function GET(){
 try{
  const sb=getSupabaseServerClient();
  const {data,error}=await sb.from('quotations').select('content').order('created_at',{ascending:false}).limit(5000);
  if(error)throw error;
  const seen=new Map<string,string>();
  for(const q of data||[])for(const item of ((q as any).content?.items||[])){
   const value=String(item?.user||'').trim();if(value&&!seen.has(value.toLowerCase()))seen.set(value.toLowerCase(),value);
  }
  return NextResponse.json({users:[...seen.values()].slice(0,200)});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Failed to load item users',users:[]},{status:500})}
}
