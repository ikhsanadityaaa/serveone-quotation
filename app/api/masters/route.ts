import {NextRequest,NextResponse} from 'next/server';
import {getSupabaseServerClient} from '@/lib/supabase-server';
import {STANDARD_UOMS} from '@/lib/uoms';
import {COMPANY_ADDRESS} from '@/lib/constants';
export const runtime='nodejs';

export async function GET(req:NextRequest){
 try{
  const sb=getSupabaseServerClient();const coreOnly=req.nextUrl.searchParams.get('scope')==='core';
  const salesP=sb.from('sales_people').select('*').order('name');
  const directorsP=sb.from('directors').select('*').order('name');
  const companyP=sb.from('app_settings').select('value').eq('key','company_address').maybeSingle();
  const alpha=(a:string,b:string)=>a.localeCompare(b,undefined,{sensitivity:'base'});
  if(coreOnly){
   const [sales,directors,company]=await Promise.all([salesP,directorsP,companyP]);const err=sales.error||directors.error;if(err)throw err;
   return NextResponse.json({sales:(sales.data||[]).sort((a:any,b:any)=>alpha(a.name,b.name)),directors:(directors.data||[]).map((x:any)=>({...x,signature_path:'/signature-mr-herry.png'})).sort((a:any,b:any)=>alpha(a.name,b.name)),uoms:STANDARD_UOMS,companyAddress:String(company.data?.value||COMPANY_ADDRESS)});
  }
  const [sales,members,directors,company]=await Promise.all([salesP,sb.from('member_directory').select('id,member_name,op_unit_name,client_name,address,active').eq('active',true).order('op_unit_name').order('member_name').limit(20000),directorsP,companyP]);
  const err=[sales,members,directors].find(x=>x.error)?.error;if(err)throw err;
  const addressMap=new Map<string,string>();for(const x of (members.data||[])){const key=String(x.op_unit_name||x.client_name||'');if(key&&!addressMap.get(key)&&String(x.address||'').trim())addressMap.set(key,String(x.address).trim())}
  const memberRows=(members.data||[]).map((x:any)=>({...x,address:addressMap.get(String(x.op_unit_name||x.client_name||''))||'',client_code:''})).sort((a:any,b:any)=>alpha(a.op_unit_name,b.op_unit_name)||alpha(a.member_name,b.member_name));
  return NextResponse.json({sales:(sales.data||[]).sort((a:any,b:any)=>alpha(a.name,b.name)),members:memberRows,directors:(directors.data||[]).map((x:any)=>({...x,signature_path:'/signature-mr-herry.png'})).sort((a:any,b:any)=>alpha(a.name,b.name)),uoms:STANDARD_UOMS,companyAddress:String(company.data?.value||COMPANY_ADDRESS)});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Failed'},{status:500})}
}
