import ExcelJS from 'exceljs';
import {PDFDocument,StandardFonts,rgb} from 'pdf-lib';
import type {StoredQuotation} from './types';
import {signatureData,subtotalAmount,vatAmount,totalAmount} from './quote-utils';

function money(n:number){return new Intl.NumberFormat('id-ID').format(Number(n||0))}
function wrapText(text:string,max=95){const words=String(text||'').split(/\s+/),lines:string[]=[];let line='';for(const w of words){const n=(line+' '+w).trim();if(n.length>max&&line){lines.push(line);line=w}else line=n}if(line)lines.push(line);return lines}
export async function quotationXlsx(q:StoredQuotation){const c=q.content;const wb=new ExcelJS.Workbook();const ws=wb.addWorksheet('Quotation',{pageSetup:{paperSize:9,orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0,margins:{left:.25,right:.25,top:.35,bottom:.35,header:.1,footer:.1}}});
 ws.columns=[{width:5},{width:12},{width:24},{width:26},{width:14},{width:14},{width:13},{width:9},{width:10},{width:15},{width:17},{width:20}];
 ws.mergeCells('A1:L1');ws.getCell('A1').value=c.companyName;ws.getCell('A1').font={bold:true,size:18,color:{argb:'FFC7003D'}};ws.getCell('A1').alignment={horizontal:'left'};
 ws.mergeCells('A2:L3');ws.getCell('A2').value=c.companyAddress;ws.getCell('A2').alignment={wrapText:true,vertical:'top'};
 ws.mergeCells('A5:L5');ws.getCell('A5').value='QUOTATION';ws.getCell('A5').font={bold:true,size:16};ws.getCell('A5').alignment={horizontal:'center'};
 const left=[['Quotation No.',q.quotation_no],['Date',c.quotationDate],['Validity',`${c.validityDays} Days`],['RFQ No.',c.rfqNo||'-'],['Sales PIC',[c.salesName,c.salesPhone].filter(Boolean).join(' · ')]];const right=[['Client',c.clientName],['Attention',c.attention||'-'],['Client Nm.',c.clientNm||'-'],['Address',c.address]];
 left.forEach((x,i)=>{ws.getCell(7+i,1).value=x[0];ws.getCell(7+i,2).value=x[1]});right.forEach((x,i)=>{ws.getCell(7+i,6).value=x[0];ws.mergeCells(7+i,7,7+i,12);ws.getCell(7+i,7).value=x[1];ws.getCell(7+i,7).alignment={wrapText:true}});
 const headRow=13;const heads=['No','Code','Item / Description','Specification','Brand','User','Lead Time','Qty','UOM','Unit Price','Amount','Remarks'];heads.forEach((h,i)=>{const cell=ws.getCell(headRow,i+1);cell.value=h;cell.font={bold:true,color:{argb:'FFFFFFFF'}};cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF4A4D50'}};cell.alignment={horizontal:'center',vertical:'middle',wrapText:true};cell.border={top:{style:'thin'},bottom:{style:'thin'},left:{style:'thin'},right:{style:'thin'}}});
 c.items.forEach((it,idx)=>{const r=headRow+1+idx;const vals=[idx+1,it.code,it.productName,it.spec,it.brand,it.user,it.leadTime,it.qty,it.uom,it.unitPrice,it.qty*it.unitPrice,it.remarks];vals.forEach((v,i)=>{const cell=ws.getCell(r,i+1);cell.value=v as any;cell.alignment={vertical:'top',wrapText:true};cell.border={top:{style:'thin',color:{argb:'FFD9D9D9'}},bottom:{style:'thin',color:{argb:'FFD9D9D9'}},left:{style:'thin',color:{argb:'FFD9D9D9'}},right:{style:'thin',color:{argb:'FFD9D9D9'}}};if(i===9||i===10)cell.numFmt='#,##0'});});
 let r=headRow+Math.max(c.items.length,1)+2;const subtotal=subtotalAmount(c),vat=vatAmount(c),grand=totalAmount(c);ws.getCell(r,10).value='Total Amount';ws.getCell(r,10).font={bold:true};ws.getCell(r,11).value=subtotal;ws.getCell(r,11).numFmt='#,##0';ws.getCell(r,11).font={bold:true};r++;ws.getCell(r,10).value=`Total VAT ${c.vatRate}%`;ws.getCell(r,10).font={bold:true};ws.getCell(r,11).value=vat;ws.getCell(r,11).numFmt='#,##0';ws.getCell(r,11).font={bold:true};r++;ws.getCell(r,10).value='Total Amount Include VAT';ws.getCell(r,10).font={bold:true};ws.getCell(r,11).value=grand;ws.getCell(r,11).numFmt='#,##0';ws.getCell(r,11).font={bold:true};r+=2;ws.getCell(r,1).value='Notes';ws.getCell(r,1).font={bold:true};c.notes.forEach((n,i)=>{r++;ws.mergeCells(r,1,r,7);ws.getCell(r,1).value=`${i+1}. ${n}`});
 const signRow=r+2;ws.mergeCells(signRow,10,signRow,12);ws.getCell(signRow,10).value=c.directorTitle;ws.getCell(signRow,10).alignment={horizontal:'center'};const sig=await signatureData(c.directorSignaturePath);if(sig){const id=wb.addImage({buffer:sig.buffer as any,extension:sig.kind==='png'?'png':'jpeg'});ws.addImage(id,{tl:{col:9.7,row:signRow},ext:{width:160,height:70}})}ws.mergeCells(signRow+5,10,signRow+5,12);ws.getCell(signRow+5,10).value=c.directorName;ws.getCell(signRow+5,10).font={bold:true};ws.getCell(signRow+5,10).alignment={horizontal:'center'};
 ws.eachRow(row=>row.eachCell(cell=>{cell.font={name:'Arial',size:10,...cell.font}}));ws.views=[{showGridLines:false}];const b=await wb.xlsx.writeBuffer();return Buffer.from(b)}

export async function quotationPdf(q:StoredQuotation){const c=q.content;const pdf=await PDFDocument.create();const regular=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);const A4:[number,number]=[595.28,841.89];let page=pdf.addPage(A4),y=800;const margin=38;const text=(t:string,x:number,yy:number,size=9,b=false)=>page.drawText(String(t||''),{x,y:yy,size,font:b?bold:regular,color:rgb(.15,.15,.17)});const newPage=()=>{page=pdf.addPage(A4);y=805};
 text(c.companyName,margin,y,15,true);y-=18;for(const l of wrapText(c.companyAddress,100)){text(l,margin,y,8);y-=10}y-=12;text('QUOTATION',250,y,16,true);y-=28;
 const meta=[['Quotation No.',q.quotation_no],['Date',c.quotationDate],['Validity',`${c.validityDays} Days`],['RFQ No.',c.rfqNo||'-'],['Sales PIC',[c.salesName,c.salesPhone].filter(Boolean).join(' · ')],['Client',c.clientName],['Attention',c.attention||'-'],['Client Nm.',c.clientNm||'-'],['Address',c.address]];for(const [k,v] of meta){text(k,margin,y,8,true);for(const [i,l] of wrapText(v,78).entries())text(l,145,y-i*10,8);y-=Math.max(15,wrapText(v,78).length*10)}y-=8;
 const cols=[38,58,176,285,350,405,445,490,555];const heads=['No','Item','Spec','Brand','Lead','UOM','Qty','Amount'];const drawHead=()=>{page.drawRectangle({x:margin,y:y-15,width:520,height:18,color:rgb(.28,.29,.31)});heads.forEach((h,i)=>page.drawText(h,{x:cols[i],y:y-10,size:7,font:bold,color:rgb(1,1,1)}));y-=22};drawHead();
 c.items.forEach((it,i)=>{if(y<120){newPage();drawHead()}const vals=[String(i+1),it.productName,it.spec,it.brand,it.leadTime,it.uom,String(it.qty),money(it.qty*it.unitPrice)];vals.forEach((v,j)=>text(String(v).slice(0,j===1||j===2?22:12),cols[j],y,7));y-=15});y-=8;const subtotal=subtotalAmount(c),vat=vatAmount(c),grand=totalAmount(c);text('Total Amount',370,y,9,true);text(`IDR ${money(subtotal)}`,480,y,9,true);y-=15;text(`Total VAT ${c.vatRate}%`,370,y,9,true);text(`IDR ${money(vat)}`,480,y,9,true);y-=15;text('Total Amount Include VAT',370,y,9,true);text(`IDR ${money(grand)}`,480,y,9,true);y-=28;text('Notes',margin,y,9,true);y-=14;c.notes.forEach((n,i)=>{for(const [li,l] of wrapText(`${i+1}. ${n}`,95).entries()){text(l,margin,y-li*10,8)}y-=Math.max(13,wrapText(`${i+1}. ${n}`,95).length*10)});if(y<125)newPage();y-=15;text(c.directorTitle,390,y,8);const sig=await signatureData(c.directorSignaturePath);if(sig){try{const img=sig.kind==='png'?await pdf.embedPng(sig.buffer):await pdf.embedJpg(sig.buffer);page.drawImage(img,{x:390,y:y-70,width:130,height:60})}catch{}}y-=85;text(c.directorName,390,y,9,true);return Buffer.from(await pdf.save())}

export async function historyXlsx(rows:StoredQuotation[]){
 const wb=new ExcelJS.Workbook(),ws=wb.addWorksheet('Quotation List');
 ws.columns=[
  {header:'Quotation No.',key:'quotation',width:28},{header:'Date',key:'date',width:14},{header:'Client',key:'client',width:28},{header:'Sales PIC',key:'sales',width:22},
  {header:'No',key:'no',width:7},{header:'Code',key:'code',width:15},{header:'Item / Description',key:'item',width:30},{header:'Specification',key:'spec',width:32},
  {header:'Brand',key:'brand',width:18},{header:'User',key:'user',width:18},{header:'Lead Time',key:'lead',width:14},{header:'Qty',key:'qty',width:10},
  {header:'UOM',key:'uom',width:10},{header:'Unit Price',key:'price',width:18},{header:'Amount',key:'amount',width:18},{header:'Remarks',key:'remarks',width:34}
 ];
 rows.forEach((q,group)=>{
  const items=q.content?.items?.length?q.content.items:[null];
  items.forEach((item,index)=>{
   const row=ws.addRow({
    quotation:q.quotation_no,date:q.quotation_date,client:q.client_name,sales:q.sales_name,no:item?index+1:'',
    code:item?.code||'',item:item?.productName||'',spec:item?.spec||'',brand:item?.brand||'',user:item?.user||'',lead:item?.leadTime||'',
    qty:item?.qty||'',uom:item?.uom||'',price:item?.unitPrice||'',amount:item?(item.qty||0)*(item.unitPrice||0):'',remarks:item?.remarks||''
   });
   if(group%2)row.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFF3F6FA'}};
  })
 });
 ws.getRow(1).font={bold:true,color:{argb:'FF415269'}};
 ws.getRow(1).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFE9EFF7'}};
 ws.getColumn('price').numFmt='#,##0';ws.getColumn('amount').numFmt='#,##0';
 ws.autoFilter={from:'A1',to:'P1'};ws.views=[{state:'frozen',ySplit:1}];
 return Buffer.from(await wb.xlsx.writeBuffer())
}
