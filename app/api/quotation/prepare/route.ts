import {NextRequest,NextResponse} from 'next/server';
import {getSupabaseServerClient} from '@/lib/supabase-server';
import {normalizeContent,quoteHash,totalAmount} from '@/lib/quote-utils';
import type {QuoteContent,StoredQuotation} from '@/lib/types';
export const runtime='nodejs';

export async function POST(req:NextRequest){
 try{
  const body=await req.json();
  const c=normalizeContent(body.content as QuoteContent);
  if(!c.clientId)throw new Error('Client is required');
  if(!c.salesId)throw new Error('Sales PIC is required');
  if(!c.directorId)throw new Error('President Director is required');
  if(!c.items.length)throw new Error('At least one item is required');

  const hash=quoteHash(c),sb=getSupabaseServerClient();
  const sourceId=body.sourceQuotationId?String(body.sourceQuotationId):null;

  if(sourceId){
   const {data:source,error}=await sb.from('quotations').select('*').eq('id',sourceId).single();
   if(error)throw error;
   if(source.content_hash===hash||quoteHash(source.content as QuoteContent)===hash)return NextResponse.json(source);

   const {data:created,error:createErr}=await sb.rpc('create_quotation_revision',{
    p_source_id:sourceId,
    p_quotation_date:c.quotationDate,
    p_client_name:c.clientName,
    p_client_code:c.clientCode,
    p_sales_pic_id:c.salesId,
    p_sales_name:c.salesName,
    p_total_amount:totalAmount(c),
    p_content_hash:hash,
    p_content:c
   });
   if(createErr)throw createErr;
   const row=(Array.isArray(created)?created[0]:created) as StoredQuotation|null;
   if(!row)throw new Error('Failed to create quotation revision');
   return NextResponse.json(row);
  }

  const {data:no,error:noErr}=await sb.rpc('allocate_quotation_number',{p_client_code:c.clientCode,p_quote_date:c.quotationDate});
  if(noErr)throw noErr;
  const {data,error}=await sb.from('quotations').insert({
   quotation_no:no,
   base_quotation_no:no,
   revision_no:0,
   is_latest:true,
   quotation_date:c.quotationDate,
   client_id:null,
   client_name:c.clientName,
   client_code:c.clientCode,
   sales_pic_id:c.salesId,
   sales_name:c.salesName,
   total_amount:totalAmount(c),
   content_hash:hash,
   content:c,
   source_quotation_id:null
  }).select().single();
  if(error)throw error;
  return NextResponse.json(data);
 }catch(e){
  return NextResponse.json({error:e instanceof Error?e.message:'Failed to prepare quotation'},{status:400});
 }
}
