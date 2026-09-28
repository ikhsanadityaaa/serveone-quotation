import {NextRequest,NextResponse} from 'next/server';
import {getSupabaseServerClient} from '@/lib/supabase-server';
export const runtime='nodejs';
const chunks=<T,>(items:T[],size=100)=>Array.from({length:Math.ceil(items.length/size)},(_,i)=>items.slice(i*size,(i+1)*size));
export async function DELETE(req:NextRequest){
 try{
  const {ids}=await req.json();
  if(!Array.isArray(ids)||!ids.length)throw new Error('No quotations selected');
  const clean=[...new Set(ids.map(String).filter(Boolean))];
  const sb=getSupabaseServerClient();
  for(const part of chunks(clean)){
   const {error:unlinkError}=await sb.from('quotations').update({source_quotation_id:null}).in('source_quotation_id',part);if(unlinkError)throw unlinkError;
   const {error}=await sb.from('quotations').delete().in('id',part);if(error)throw error;
  }
  return NextResponse.json({ok:true,count:clean.length,message:'Selected quotations deleted. Running numbers are not rolled back.'});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Failed to delete quotations'},{status:400})}
}
