import {NextRequest,NextResponse} from 'next/server';
import {getSupabaseServerClient} from '@/lib/supabase-server';
export const runtime='nodejs';
const chunks=<T,>(items:T[],size=100)=>Array.from({length:Math.ceil(items.length/size)},(_,i)=>items.slice(i*size,(i+1)*size));

async function repairLatest(sb:ReturnType<typeof getSupabaseServerClient>,base:string){
 const {error:clearErr}=await sb.from('quotations').update({is_latest:false}).eq('base_quotation_no',base);if(clearErr)throw clearErr;
 const {data:latest,error:latestErr}=await sb.from('quotations').select('id').eq('base_quotation_no',base).order('revision_no',{ascending:false}).order('created_at',{ascending:false}).limit(1).maybeSingle();if(latestErr)throw latestErr;
 if(latest?.id){const {error:setErr}=await sb.from('quotations').update({is_latest:true}).eq('id',latest.id);if(setErr)throw setErr}
}

export async function DELETE(req:NextRequest){
 try{
  const {ids}=await req.json();
  if(!Array.isArray(ids)||!ids.length)throw new Error('No quotations selected');
  const clean=[...new Set(ids.map(String).filter(Boolean))];
  const sb=getSupabaseServerClient();
  const {data:targets,error:targetErr}=await sb.from('quotations').select('id,base_quotation_no,quotation_no').in('id',clean);if(targetErr)throw targetErr;
  const affected=[...new Set((targets||[]).map(x=>String(x.base_quotation_no||x.quotation_no||'')).filter(Boolean))];
  for(const part of chunks(clean)){
   const {error:unlinkError}=await sb.from('quotations').update({source_quotation_id:null}).in('source_quotation_id',part);if(unlinkError)throw unlinkError;
   const {error}=await sb.from('quotations').delete().in('id',part);if(error)throw error;
  }
  for(const base of affected)await repairLatest(sb,base);
  return NextResponse.json({ok:true,count:clean.length,message:'Selected quotations deleted. Running numbers are not rolled back.'});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Failed to delete quotations'},{status:400})}
}
