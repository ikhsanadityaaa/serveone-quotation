import {NextRequest} from 'next/server';
import {getSupabaseServerClient} from '@/lib/supabase-server';
import {quotationPdf} from '@/lib/renderers';
export const runtime='nodejs';
const safePdfFilename=(value:string)=>`${String(value||'quotation').replace(/[^a-zA-Z0-9._-]/g,'_')}.pdf`;
export async function POST(req:NextRequest){try{const {quotationId}=await req.json();const sb=getSupabaseServerClient();const {data,error}=await sb.from('quotations').select('*').eq('id',quotationId).single();if(error)throw error;const b=await quotationPdf(data);return new Response(new Uint8Array(b),{headers:{'content-type':'application/pdf','content-disposition':`attachment; filename="${safePdfFilename(data.quotation_no)}"`,'cache-control':'no-store'}})}catch(e){return new Response(e instanceof Error?e.message:'Export failed',{status:400})}}
