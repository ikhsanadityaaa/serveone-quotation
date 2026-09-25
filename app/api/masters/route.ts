import {NextResponse} from 'next/server';
import {getSupabaseServerClient} from '@/lib/supabase-server';
import {STANDARD_UOMS} from '@/lib/uoms';
export const runtime='nodejs';

export async function GET(){
 try{
  const sb=getSupabaseServerClient();
  const [sales,members,codes,directors,uoms]=await Promise.all([
   sb.from('sales_people').select('*').order('name'),
   sb.from('member_directory').select('*').eq('active',true).order('client_name').order('op_unit_name').order('member_name').limit(5000),
   sb.from('client_code_registry').select('*'),
   sb.from('directors').select('*').order('name'),
   sb.from('uoms').select('*').order('code')
  ]);
  const err=[sales,members,codes,directors,uoms].find(x=>x.error)?.error;if(err)throw err;
  const cm=new Map((codes.data||[]).map((x:any)=>[x.client_name,x.client_code]));
  const memberRows=(members.data||[]).map((x:any)=>({...x,client_code:cm.get(x.client_name)||''}));
  let uomRows=uoms.data||[];
  if(!uomRows.length){
   const seed=STANDARD_UOMS.map(({id,...row})=>row);
   const {error:seedError}=await sb.from('uoms').upsert(seed,{onConflict:'code'});if(seedError)throw seedError;
   const {data:seeded,error:reloadError}=await sb.from('uoms').select('*').order('code');if(reloadError)throw reloadError;uomRows=seeded||[];
  }
  const directorRows=(directors.data||[]).map((x:any)=>({...x,signature_path:'/signature-mr-herry.png'}));
  return NextResponse.json({sales:sales.data||[],members:memberRows,directors:directorRows,uoms:uomRows});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Failed'},{status:500})}
}
