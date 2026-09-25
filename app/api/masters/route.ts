import {NextRequest,NextResponse} from 'next/server';
import {getSupabaseServerClient} from '@/lib/supabase-server';
import {STANDARD_UOMS} from '@/lib/uoms';
export const runtime='nodejs';

export async function GET(req:NextRequest){
 try{
  const sb=getSupabaseServerClient();const coreOnly=req.nextUrl.searchParams.get('scope')==='core';
  const salesP=sb.from('sales_people').select('*').order('name');
  const directorsP=sb.from('directors').select('*').order('name');
  if(coreOnly){const [sales,directors]=await Promise.all([salesP,directorsP]);const err=sales.error||directors.error;if(err)throw err;const alpha=(a:string,b:string)=>a.localeCompare(b,undefined,{sensitivity:'base'});return NextResponse.json({sales:(sales.data||[]).sort((a:any,b:any)=>alpha(a.name,b.name)),directors:(directors.data||[]).map((x:any)=>({...x,signature_path:'/signature-mr-herry.png'})).sort((a:any,b:any)=>alpha(a.name,b.name)),uoms:STANDARD_UOMS})}
  const [sales,members,codes,directors]=await Promise.all([salesP,sb.from('member_directory').select('*').eq('active',true).order('op_unit_name').order('member_name').limit(10000),sb.from('client_code_registry').select('*'),directorsP]);
  const err=[sales,members,codes,directors].find(x=>x.error)?.error;if(err)throw err;
  const cm=new Map((codes.data||[]).map((x:any)=>[x.client_name,x.client_code]));
  const alpha=(a:string,b:string)=>a.localeCompare(b,undefined,{sensitivity:'base'});
  const addressMap=new Map<string,string>();for(const x of (members.data||[])){const key=String(x.op_unit_name||x.client_name||'');if(key&&!addressMap.get(key)&&String(x.address||'').trim())addressMap.set(key,String(x.address).trim())}
  const memberRows=(members.data||[]).map((x:any)=>({...x,address:addressMap.get(String(x.op_unit_name||x.client_name||''))||'',client_code:cm.get(x.op_unit_name)||cm.get(x.client_name)||''})).sort((a:any,b:any)=>alpha(a.op_unit_name,b.op_unit_name)||alpha(a.member_name,b.member_name));
  return NextResponse.json({sales:(sales.data||[]).sort((a:any,b:any)=>alpha(a.name,b.name)),members:memberRows,directors:(directors.data||[]).map((x:any)=>({...x,signature_path:'/signature-mr-herry.png'})).sort((a:any,b:any)=>alpha(a.name,b.name)),uoms:STANDARD_UOMS});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Failed'},{status:500})}
}
