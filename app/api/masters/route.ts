import {NextResponse} from 'next/server';
import {getSupabaseServerClient} from '@/lib/supabase-server';
import {STANDARD_UOMS} from '@/lib/uoms';
export const runtime='nodejs';

export async function GET(){
 try{
  const sb=getSupabaseServerClient();
  const [sales,members,codes,directors]=await Promise.all([
   sb.from('sales_people').select('*').order('name'),
   sb.from('member_directory').select('*').eq('active',true).order('client_name').order('op_unit_name').order('member_name').limit(5000),
   sb.from('client_code_registry').select('*'),
   sb.from('directors').select('*').order('name')
  ]);
  const err=[sales,members,codes,directors].find(x=>x.error)?.error;if(err)throw err;
  const cm=new Map((codes.data||[]).map((x:any)=>[x.client_name,x.client_code]));
  const memberRows=(members.data||[]).map((x:any)=>({...x,client_code:cm.get(x.client_name)||''}));
  const directorRows=(directors.data||[]).map((x:any)=>({...x,signature_path:'/signature-mr-herry.png'}));
  return NextResponse.json({sales:sales.data||[],members:memberRows,directors:directorRows,uoms:STANDARD_UOMS});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Failed'},{status:500})}
}
