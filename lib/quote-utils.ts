import crypto from 'node:crypto';
import type { QuoteContent, QuoteItem } from './types';
import {COMPANY_NAME,COMPANY_ADDRESS} from './constants';
export function cleanItems(items:QuoteItem[]){return (items||[]).map(x=>({code:String(x.code||'').trim(),productName:String(x.productName||'').trim(),spec:String(x.spec||'').trim(),brand:String(x.brand||'').trim(),user:String(x.user||'').trim(),leadTime:String(x.leadTime||'').trim(),qty:Math.max(0,Number(x.qty||0)),uom:String(x.uom||'EA').trim().toUpperCase(),unitPrice:Number(x.unitPrice||0),remarks:String(x.remarks||'').trim()})).filter(x=>x.code||x.productName||x.spec||x.brand||x.user||x.qty||x.unitPrice||x.remarks)}
export function normalizeContent(c:QuoteContent):QuoteContent{return {...c,quotationDate:String(c.quotationDate),validityDays:Number(c.validityDays||30),vatRate:Number.isFinite(Number(c.vatRate))?Number(c.vatRate):11,paymentCondition:String(c.paymentCondition||'').trim(),rfqNo:String(c.rfqNo||'').trim(),salesId:String(c.salesId||''),salesName:String(c.salesName||'').trim(),salesEmail:String(c.salesEmail||''),salesPhone:String(c.salesPhone||''),clientId:String(c.clientId||''),clientName:String(c.clientName||'').trim(),clientNm:String(c.clientNm||'').trim(),clientCode:String(c.clientCode||'').trim().toUpperCase(),attention:String(c.attention||'').trim(),address:String(c.address||'').trim(),items:cleanItems(c.items),notes:(c.notes||[]).map(x=>String(x).trim()).filter(Boolean),directorId:String(c.directorId||''),directorName:String(c.directorName||'').trim(),directorTitle:String(c.directorTitle||'President Director').trim(),directorSignaturePath:c.directorSignaturePath||undefined,companyName:c.companyName||COMPANY_NAME,companyAddress:c.companyAddress||COMPANY_ADDRESS}}
export function quoteHash(c:QuoteContent){return crypto.createHash('sha256').update(JSON.stringify(normalizeContent(c))).digest('hex')}
export function subtotalAmount(c:QuoteContent){return cleanItems(c.items).reduce((s,x)=>s+x.qty*x.unitPrice,0)}
export function vatAmount(c:QuoteContent){const subtotal=subtotalAmount(c);const rate=Number.isFinite(Number(c.vatRate))?Number(c.vatRate):11;return subtotal*rate/100}
export function totalAmount(c:QuoteContent){return subtotalAmount(c)+vatAmount(c)}
export async function signatureData(path?:string){
 if(!path)return null;
 if(path.startsWith('/')){
  try{const fs=await import('node:fs/promises');const p=await import('node:path');const file=p.join(process.cwd(),'public',path.replace(/^\/+/,''));const b=await fs.readFile(file);return {buffer:b,kind:path.toLowerCase().endsWith('.png')?'png' as const:'jpg' as const}}catch{return null}
 }
 const {getSupabaseServerClient}=await import('./supabase-server'); const sb=getSupabaseServerClient(); const {data,error}=await sb.storage.from('signatures').download(path); if(error||!data)return null; const b=Buffer.from(await data.arrayBuffer()); return {buffer:b,kind:path.toLowerCase().endsWith('.png')?'png' as const:'jpg' as const};
}
