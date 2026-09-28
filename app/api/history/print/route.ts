import {NextRequest} from 'next/server';
import {PDFDocument} from 'pdf-lib';
import {getSupabaseServerClient} from '@/lib/supabase-server';
import {quotationPdf} from '@/lib/renderers';
import type {StoredQuotation} from '@/lib/types';
export const runtime='nodejs';
export async function POST(req:NextRequest){
 try{
  const {ids}=await req.json();
  if(!Array.isArray(ids)||!ids.length)throw new Error('No quotations selected');
  const clean=[...new Set(ids.map(String).filter(Boolean))];
  const sb=getSupabaseServerClient();
  const {data,error}=await sb.from('quotations').select('*').in('id',clean);
  if(error)throw error;
  const byId=new Map((data||[]).map(q=>[q.id,q as StoredQuotation]));
  const ordered=clean.map(id=>byId.get(id)).filter(Boolean) as StoredQuotation[];
  if(!ordered.length)throw new Error('Selected quotations were not found');
  const merged=await PDFDocument.create();
  for(const quote of ordered){
   const bytes=await quotationPdf(quote);const src=await PDFDocument.load(bytes);const pages=await merged.copyPages(src,src.getPageIndices());pages.forEach(p=>merged.addPage(p));
  }
  const out=await merged.save();
  return new Response(new Uint8Array(out),{headers:{'content-type':'application/pdf','content-disposition':'inline; filename="selected-quotations.pdf"'}});
 }catch(e){return new Response(e instanceof Error?e.message:'Print failed',{status:400})}
}
