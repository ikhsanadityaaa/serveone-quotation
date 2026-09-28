import {NextRequest} from 'next/server';
import {PDFDocument} from 'pdf-lib';
import {getSupabaseServerClient} from '@/lib/supabase-server';
import {quotationPdf} from '@/lib/renderers';
import type {StoredQuotation} from '@/lib/types';
export const runtime='nodejs';

const safePdfFilename=(value:string)=>`${String(value||'quotation').replace(/[^a-zA-Z0-9._-]/g,'_')}.pdf`;

async function renderSelected(ids:unknown){
 if(!Array.isArray(ids)||!ids.length)throw new Error('No quotations selected');
 const clean=[...new Set(ids.map(String).map(x=>x.trim()).filter(Boolean))];
 const sb=getSupabaseServerClient();
 // Read quotation data only. The rendered PDF is generated in memory and is never written to Supabase/database/storage.
 const {data,error}=await sb.from('quotations').select('*').in('id',clean);
 if(error)throw error;
 const byId=new Map((data||[]).map(q=>[q.id,q as StoredQuotation]));
 const ordered=clean.map(id=>byId.get(id)).filter(Boolean) as StoredQuotation[];
 if(!ordered.length)throw new Error('Selected quotations were not found');
 const merged=await PDFDocument.create();
 for(const quote of ordered){
  const bytes=await quotationPdf(quote);
  const src=await PDFDocument.load(bytes);
  const pages=await merged.copyPages(src,src.getPageIndices());
  pages.forEach(p=>merged.addPage(p));
 }
 const out=await merged.save();
 const filename=ordered.length===1?safePdfFilename(ordered[0].quotation_no):'selected-quotations.pdf';
 return new Response(new Uint8Array(out),{headers:{
  'content-type':'application/pdf',
  'content-disposition':`inline; filename="${filename}"`,
  'cache-control':'no-store'
 }});
}

export async function GET(req:NextRequest){
 try{
  const ids=(req.nextUrl.searchParams.get('ids')||'').split(',').map(x=>x.trim()).filter(Boolean);
  return await renderSelected(ids);
 }catch(e){return new Response(e instanceof Error?e.message:'Print failed',{status:400})}
}

export async function POST(req:NextRequest){
 try{
  const contentType=req.headers.get('content-type')||'';
  let ids:unknown;
  if(contentType.includes('application/json')){
   ({ids}=await req.json());
  }else{
   const form=await req.formData();
   const raw=form.get('ids');
   ids=typeof raw==='string'?JSON.parse(raw):[];
  }
  return await renderSelected(ids);
 }catch(e){return new Response(e instanceof Error?e.message:'Print failed',{status:400})}
}
