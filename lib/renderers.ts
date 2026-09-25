import ExcelJS from 'exceljs';
import {PDFDocument,StandardFonts,rgb,PDFFont,PDFPage} from 'pdf-lib';
import type {StoredQuotation} from './types';
import {signatureData,subtotalAmount,vatAmount,totalAmount} from './quote-utils';

const SERVEONE_RED='FFC7003D';
const GRID='FFDCE2E8';
const LIGHT='FFF7F8FA';
const ZEBRA='FFFAFBFC';
const TEXT='FF202A36';

function money(n:number){return new Intl.NumberFormat('id-ID').format(Number(n||0))}
function wrapText(text:string,max=95){const words=String(text||'').split(/\s+/).filter(Boolean),lines:string[]=[];let line='';for(const w of words){const n=(line+' '+w).trim();if(n.length>max&&line){lines.push(line);line=w}else line=n}if(line)lines.push(line);return lines.length?lines:['']}
function indonesiaDate(iso:string){const d=new Date(`${iso}T00:00:00+07:00`);const months=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];return `${String(d.getDate()).padStart(2,'0')} ${months[d.getMonth()]} ${d.getFullYear()}`}
function salesLines(c:StoredQuotation['content']){return [c.salesName,c.salesEmail||'',c.salesPhone||''].filter(Boolean)}

export async function quotationXlsx(q:StoredQuotation){
 const c=q.content;const wb=new ExcelJS.Workbook();
 const ws=wb.addWorksheet('Quotation',{pageSetup:{paperSize:9,orientation:'portrait',fitToPage:true,fitToWidth:1,fitToHeight:0,margins:{left:.22,right:.22,top:.25,bottom:.3,header:.08,footer:.08}}});
 ws.views=[{showGridLines:false}];
 ws.columns=[{width:5},{width:11},{width:20},{width:24},{width:13},{width:13},{width:14},{width:9},{width:10},{width:16},{width:17},{width:18}];
 const logo=await signatureData('/serveone-logo.png');
 if(logo){const id=wb.addImage({buffer:logo.buffer as any,extension:'png'});ws.addImage(id,{tl:{col:0,row:0},ext:{width:180,height:55}})}
 ws.mergeCells('G1:L1');ws.getCell('G1').value=c.companyName;ws.getCell('G1').font={bold:true,size:12,color:{argb:SERVEONE_RED}};ws.getCell('G1').alignment={horizontal:'right'};
 ws.mergeCells('G2:L3');ws.getCell('G2').value=c.companyAddress;ws.getCell('G2').font={size:8,color:{argb:'FF5F6875'}};ws.getCell('G2').alignment={horizontal:'right',vertical:'top',wrapText:true};
 ws.mergeCells('A4:L4');ws.getCell('A4').fill={type:'pattern',pattern:'solid',fgColor:{argb:SERVEONE_RED}};ws.getRow(4).height=3;
 ws.mergeCells('A5:L5');ws.getCell('A5').value='QUOTATION';ws.getCell('A5').font={bold:true,size:17,color:{argb:TEXT}};ws.getCell('A5').alignment={horizontal:'center',vertical:'middle'};ws.getRow(5).height=27;

 const left:[string,string][]=[['Quotation No.',q.quotation_no],['Date',c.quotationDate],['Validity',`${c.validityDays} Days`],['RFQ No.',c.rfqNo||'-'],['Sales PIC',salesLines(c).join('\n')]];
 const right:[string,string][]=[['Attention',c.attention||'-'],['Client',c.clientName||'-'],['Address',c.address||'-']];
 let lr=7;
 left.forEach(([k,v],i)=>{const r=lr+i;ws.mergeCells(r,1,r,2);ws.mergeCells(r,3,r,5);ws.getCell(r,1).value=k;ws.getCell(r,3).value=v;ws.getCell(r,1).font={bold:true,color:{argb:'FF4A5565'}};ws.getCell(r,3).alignment={vertical:'top',wrapText:true};ws.getCell(r,1).alignment={vertical:'top'};if(k==='Sales PIC')ws.getRow(r).height=42});
 right.forEach(([k,v],i)=>{const r=lr+i;ws.mergeCells(r,7,r,8);ws.mergeCells(r,9,r,12);ws.getCell(r,7).value=k;ws.getCell(r,9).value=v;ws.getCell(r,7).font={bold:true,color:{argb:'FF4A5565'}};ws.getCell(r,9).alignment={vertical:'top',wrapText:true};ws.getCell(r,7).alignment={vertical:'top'};if(k==='Address')ws.getRow(r).height=45});
 for(let r=7;r<=11;r++){for(let col=1;col<=5;col++)ws.getCell(r,col).border={bottom:{style:'hair',color:{argb:GRID}}};for(let col=7;col<=12;col++)ws.getCell(r,col).border={bottom:{style:'hair',color:{argb:GRID}}}}

 const headRow=14;const heads=['No','Code','Item / Description','Specification','Brand','User','Lead Time (Days)','Qty','UOM','Unit Price','Amount','Remarks'];
 heads.forEach((h,i)=>{const cell=ws.getCell(headRow,i+1);cell.value=h;cell.font={bold:true,color:{argb:'FFFFFFFF'},size:8};cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:SERVEONE_RED}};cell.alignment={horizontal:'center',vertical:'middle',wrapText:true};cell.border={bottom:{style:'thin',color:{argb:SERVEONE_RED}}}});ws.getRow(headRow).height=27;
 c.items.forEach((it,idx)=>{const r=headRow+1+idx;const vals=[idx+1,it.code,it.productName,it.spec,it.brand,it.user,it.leadTime,it.qty,it.uom,it.unitPrice,it.qty*it.unitPrice,it.remarks];
  vals.forEach((v,i)=>{const cell=ws.getCell(r,i+1);cell.value=v as any;cell.border={bottom:{style:'thin',color:{argb:GRID}}};cell.alignment={vertical:'top',wrapText:true};if(idx%2)cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:ZEBRA}};
   if(i<=5)cell.alignment={vertical:'top',horizontal:'left',wrapText:true};if(i===6)cell.alignment={vertical:'top',horizontal:'center',wrapText:true};if(i===7)cell.alignment={vertical:'top',horizontal:'right'};if(i===8)cell.alignment={vertical:'top',horizontal:'left'};if(i===9||i===10){cell.numFmt='"IDR"* #,##0';cell.alignment={vertical:'top',horizontal:'right'}}
  });ws.getRow(r).height=30;
 });
 let r=headRow+Math.max(c.items.length,1)+2;const subtotal=subtotalAmount(c),vat=vatAmount(c),grand=totalAmount(c);
 const totals=[['Total Amount',subtotal],['Total VAT '+c.vatRate+'%',vat],['Total Amount Include VAT',grand]] as const;
 totals.forEach(([label,value],i)=>{const rr=r+i;ws.mergeCells(rr,7,rr,9);ws.getCell(rr,7).value=label;ws.getCell(rr,7).font={bold:true,color:{argb:i===2?SERVEONE_RED:TEXT}};ws.getCell(rr,7).alignment={horizontal:'left'};ws.mergeCells(rr,10,rr,12);ws.getCell(rr,10).value=value;ws.getCell(rr,10).numFmt='"IDR"* #,##0';ws.getCell(rr,10).font={bold:true,color:{argb:i===2?SERVEONE_RED:TEXT}};ws.getCell(rr,10).alignment={horizontal:'right'};for(let cc=7;cc<=12;cc++)ws.getCell(rr,cc).border={bottom:{style:'thin',color:{argb:GRID}}}});
 r+=5;ws.mergeCells(r,1,r,6);ws.getCell(r,1).value='Notes';ws.getCell(r,1).font={bold:true,color:{argb:SERVEONE_RED}};c.notes.forEach((n,i)=>{r++;ws.mergeCells(r,1,r,8);ws.getCell(r,1).value=`${i+1}. ${n}`;ws.getCell(r,1).alignment={wrapText:true,vertical:'top'}});
 const signRow=Math.max(r+2,headRow+c.items.length+8);ws.mergeCells(signRow,9,signRow,12);ws.getCell(signRow,9).value=`Jakarta, ${indonesiaDate(c.quotationDate)}`;ws.getCell(signRow,9).alignment={horizontal:'center'};ws.mergeCells(signRow+1,9,signRow+1,12);ws.getCell(signRow+1,9).value='President Director,';ws.getCell(signRow+1,9).alignment={horizontal:'center'};
 const sig=await signatureData(c.directorSignaturePath||'/signature-mr-herry.png');if(sig){const id=wb.addImage({buffer:sig.buffer as any,extension:sig.kind==='png'?'png':'jpeg'});ws.addImage(id,{tl:{col:8.8,row:signRow+1.5},ext:{width:160,height:70}})}
 ws.mergeCells(signRow+6,9,signRow+6,12);ws.getCell(signRow+6,9).value=c.directorName;ws.getCell(signRow+6,9).font={bold:true};ws.getCell(signRow+6,9).alignment={horizontal:'center'};
 ws.eachRow(row=>row.eachCell(cell=>{cell.font={name:'Arial',size:9,...cell.font}}));const b=await wb.xlsx.writeBuffer();return Buffer.from(b)
}

type PdfCtx={page:PDFPage;regular:PDFFont;bold:PDFFont};
function pdfWrap(font:PDFFont,text:string,size:number,maxWidth:number){const words=String(text||'').split(/\s+/).filter(Boolean);const lines:string[]=[];let line='';for(const word of words){const next=(line+' '+word).trim();if(line&&font.widthOfTextAtSize(next,size)>maxWidth){lines.push(line);line=word}else line=next}if(line)lines.push(line);return lines.length?lines:['']}
function drawLines(ctx:PdfCtx,lines:string[],x:number,y:number,size:number,maxWidth:number,bold=false,align:'left'|'center'|'right'='left',color=rgb(.15,.17,.2)){const font=bold?ctx.bold:ctx.regular;lines.forEach((line,i)=>{const w=font.widthOfTextAtSize(line,size);let xx=x;if(align==='center')xx=x+(maxWidth-w)/2;if(align==='right')xx=x+maxWidth-w;ctx.page.drawText(line,{x:xx,y:y-i*(size+2),size,font,color})})}

export async function quotationPdf(q:StoredQuotation){
 const c=q.content;const pdf=await PDFDocument.create();const regular=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);const A4:[number,number]=[595.28,841.89],margin=32,red=rgb(.78,0,.24),muted=rgb(.34,.38,.44),line=rgb(.86,.88,.91),zebra=rgb(.975,.98,.985);let page=pdf.addPage(A4);let ctx:PdfCtx={page,regular,bold};
 const logo=await signatureData('/serveone-logo.png');if(logo){try{const img=await pdf.embedPng(logo.buffer);page.drawImage(img,{x:margin,y:775,width:150,height:48})}catch{}}
 drawLines(ctx,[c.companyName],315,805,9,248,true,'right',red);drawLines(ctx,pdfWrap(regular,c.companyAddress,7,248),315,790,7,248,false,'right',muted);page.drawRectangle({x:margin,y:760,width:531,height:2,color:red});drawLines(ctx,['QUOTATION'],margin,733,16,531,true,'center');
 // Two information columns
 const top=705,leftX=margin,leftW=225,rightX=276,rightW=287;page.drawRectangle({x:leftX,y:584,width:leftW,height:116,color:rgb(.985,.987,.99),borderColor:line,borderWidth:.6});page.drawRectangle({x:rightX,y:584,width:rightW,height:116,color:rgb(.985,.987,.99),borderColor:line,borderWidth:.6});
 const leftRows:[string,string[]][]=[['Quotation No.',[q.quotation_no]],['Date',[c.quotationDate]],['Validity',[`${c.validityDays} Days`]],['RFQ No.',[c.rfqNo||'-']],['Sales PIC',salesLines(c)]];let ly=top-18;for(const [label,vals] of leftRows){drawLines(ctx,[label],leftX+10,ly,7.2,75,true,'left',muted);drawLines(ctx,vals,leftX+87,ly,7.2,leftW-97,false,'left');ly-=Math.max(17,vals.length*10)}
 const rightRows:[string,string[]][]=[['Attention',[c.attention||'-']],['Client',[c.clientName||'-']],['Address',pdfWrap(regular,c.address||'-',7.2,rightW-92)]];let ry=top-18;for(const [label,vals] of rightRows){drawLines(ctx,[label],rightX+10,ry,7.2,68,true,'left',muted);drawLines(ctx,vals,rightX+82,ry,7.2,rightW-92,false,'left');ry-=Math.max(21,vals.length*10)}
 let y=564;
 const cols=[{k:'no',h:'No',w:18,a:'left'},{k:'code',h:'Code',w:31,a:'left'},{k:'item',h:'Item / Description',w:62,a:'left'},{k:'spec',h:'Specification',w:72,a:'left'},{k:'brand',h:'Brand',w:37,a:'left'},{k:'user',h:'User',w:35,a:'left'},{k:'lead',h:'Lead Time\n(Days)',w:36,a:'center'},{k:'uom',h:'UOM',w:28,a:'left'},{k:'qty',h:'Qty',w:25,a:'right'},{k:'price',h:'Unit Price',w:45,a:'currency'},{k:'amount',h:'Amount',w:50,a:'currency'},{k:'remarks',h:'Remarks',w:45,a:'left'}] as const;const tableW=cols.reduce((s,c)=>s+c.w,0);const drawHeader=()=>{page.drawRectangle({x:margin,y:y-22,width:tableW,height:22,color:red});let x=margin;for(const col of cols){const hs=col.h.split('\n');drawLines(ctx,hs,x,y-8,5.6,col.w,true,'center',rgb(1,1,1));x+=col.w}y-=22};drawHeader();
 const cellLines=(font:PDFFont,v:string,size:number,w:number)=>pdfWrap(font,v,size,Math.max(8,w-4));
 for(let i=0;i<c.items.length;i++){const it=c.items[i];const values:any={no:String(i+1),code:it.code||'',item:it.productName||'',spec:it.spec||'',brand:it.brand||'',user:it.user||'',lead:it.leadTime||'',uom:it.uom||'',qty:String(it.qty||''),price:it.unitPrice||0,amount:(it.qty||0)*(it.unitPrice||0),remarks:it.remarks||''};const textCols=cols.map(col=>col.a==='currency'?[]:cellLines(regular,String(values[col.k]??''),5.4,col.w));const lineCount=Math.max(1,...textCols.map(x=>x.length));const rowH=Math.max(18,lineCount*7+5);if(y-rowH<145){page=pdf.addPage(A4);ctx={page,regular,bold};y=805;drawHeader()}if(i%2)page.drawRectangle({x:margin,y:y-rowH,width:tableW,height:rowH,color:zebra});page.drawLine({start:{x:margin,y:y-rowH},end:{x:margin+tableW,y:y-rowH},thickness:.45,color:line});let x=margin;for(let ci=0;ci<cols.length;ci++){const col=cols[ci];if(col.a==='currency'){drawLines(ctx,['IDR'],x+2,y-10,5.2,col.w-4,false,'left',muted);drawLines(ctx,[money(values[col.k])],x+2,y-10,5.2,col.w-4,false,'right')}else{drawLines(ctx,textCols[ci],x+2,y-9,5.4,col.w-4,false,col.a as any)}x+=col.w}y-=rowH}
 y-=10;const subtotal=subtotalAmount(c),vat=vatAmount(c),grand=totalAmount(c);const totalX=300,totalW=263;const totals=[['Total Amount',subtotal],['Total VAT '+c.vatRate+'%',vat],['Total Amount Include VAT',grand]] as const;for(let i=0;i<totals.length;i++){const [label,value]=totals[i];page.drawLine({start:{x:totalX,y:y-13},end:{x:totalX+totalW,y:y-13},thickness:.45,color:line});drawLines(ctx,[label],totalX,y,8,totalW-125,true,'left',i===2?red:rgb(.15,.17,.2));drawLines(ctx,['IDR'],totalX+142,y,8,25,false,'left',muted);drawLines(ctx,[money(value)],totalX+170,y,8,totalW-170,true,'right',i===2?red:rgb(.15,.17,.2));y-=18}
 y-=13;drawLines(ctx,['Notes'],margin,y,8.5,250,true,'left',red);y-=14;for(let i=0;i<c.notes.length;i++){const lines=pdfWrap(regular,`${i+1}. ${c.notes[i]}`,7.2,300);drawLines(ctx,lines,margin,y,7.2,300);y-=Math.max(12,lines.length*9)}
 const signatureTop=Math.max(90,y-5);drawLines(ctx,[`Jakarta, ${indonesiaDate(c.quotationDate)}`],365,signatureTop,7.6,180,false,'center');drawLines(ctx,['President Director,'],365,signatureTop-15,7.6,180,false,'center');const sig=await signatureData(c.directorSignaturePath||'/signature-mr-herry.png');if(sig){try{const img=sig.kind==='png'?await pdf.embedPng(sig.buffer):await pdf.embedJpg(sig.buffer);page.drawImage(img,{x:390,y:signatureTop-82,width:130,height:58})}catch{}}drawLines(ctx,[c.directorName],365,signatureTop-92,8.2,180,true,'center');
 return Buffer.from(await pdf.save())
}

export async function historyXlsx(rows:StoredQuotation[]){
 const wb=new ExcelJS.Workbook(),ws=wb.addWorksheet('Quotation List');ws.columns=[{header:'Quotation No.',key:'quotation',width:28},{header:'Date',key:'date',width:14},{header:'Client',key:'client',width:28},{header:'Sales PIC',key:'sales',width:22},{header:'No',key:'no',width:7},{header:'Code',key:'code',width:15},{header:'Item / Description',key:'item',width:30},{header:'Specification',key:'spec',width:32},{header:'Brand',key:'brand',width:18},{header:'User',key:'user',width:18},{header:'Lead Time (Days)',key:'lead',width:16},{header:'Qty',key:'qty',width:10},{header:'UOM',key:'uom',width:10},{header:'Unit Price',key:'price',width:18},{header:'Amount',key:'amount',width:18},{header:'Remarks',key:'remarks',width:34}];
 rows.forEach((q,group)=>{const items=q.content?.items?.length?q.content.items:[null];items.forEach((item,index)=>{const row=ws.addRow({quotation:q.quotation_no,date:q.quotation_date,client:q.client_name,sales:q.sales_name,no:item?index+1:'',code:item?.code||'',item:item?.productName||'',spec:item?.spec||'',brand:item?.brand||'',user:item?.user||'',lead:item?.leadTime||'',qty:item?.qty||'',uom:item?.uom||'',price:item?.unitPrice||'',amount:item?(item.qty||0)*(item.unitPrice||0):'',remarks:item?.remarks||''});if(group%2)row.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFF3F6FA'}}})});ws.getRow(1).font={bold:true,color:{argb:'FFFFFFFF'}};ws.getRow(1).fill={type:'pattern',pattern:'solid',fgColor:{argb:SERVEONE_RED}};ws.getRow(1).alignment={horizontal:'center',vertical:'middle',wrapText:true};ws.getColumn('price').numFmt='"IDR"* #,##0';ws.getColumn('amount').numFmt='"IDR"* #,##0';ws.autoFilter={from:'A1',to:'P1'};ws.views=[{state:'frozen',ySplit:1}];return Buffer.from(await wb.xlsx.writeBuffer())
}
