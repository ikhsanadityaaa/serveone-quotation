import ExcelJS from 'exceljs';
import {PDFDocument,StandardFonts,rgb,PDFFont,PDFPage} from 'pdf-lib';
import type {StoredQuotation} from './types';
import {signatureData,subtotalAmount,vatAmount,totalAmount} from './quote-utils';

const GRID='FFD9DEE5';
const LIGHT='FFF4F6F8';
const ZEBRA='FFFAFBFC';
const TEXT='FF111111';

function money(n:number){return new Intl.NumberFormat('id-ID').format(Number(n||0))}
function indonesiaDate(iso:string){const d=new Date(`${iso}T00:00:00+07:00`);const months=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];return `${String(d.getDate()).padStart(2,'0')} ${months[d.getMonth()]} ${d.getFullYear()}`}
function indonesiaToday(){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const m=Object.fromEntries(parts.map(x=>[x.type,x.value]));return indonesiaDate(`${m.year}-${m.month}-${m.day}`)}

export async function quotationXlsx(q:StoredQuotation){
 const c=q.content;const wb=new ExcelJS.Workbook();
 const ws=wb.addWorksheet('Quotation',{pageSetup:{paperSize:9,orientation:'portrait',fitToPage:true,fitToWidth:1,fitToHeight:0,margins:{left:.22,right:.22,top:.22,bottom:.3,header:.08,footer:.08}}});
 ws.views=[{showGridLines:false}];
 ws.columns=[{width:5},{width:20},{width:25},{width:13},{width:13},{width:15},{width:9},{width:10},{width:17},{width:18},{width:19}];
 const logo=await signatureData('/serveone-logo.png');
 if(logo){const id=wb.addImage({buffer:logo.buffer as any,extension:'png'});ws.addImage(id,{tl:{col:0,row:0},ext:{width:180,height:27}})}
 ws.mergeCells('F1:K1');ws.getCell('F1').value=c.companyName;ws.getCell('F1').font={bold:true,size:14,color:{argb:TEXT}};ws.getCell('F1').alignment={horizontal:'right'};
 ws.mergeCells('F2:K3');ws.getCell('F2').value=c.companyAddress;ws.getCell('F2').font={size:8,color:{argb:TEXT}};ws.getCell('F2').alignment={horizontal:'right',vertical:'top',wrapText:true};
 ws.mergeCells('A4:K4');ws.getCell('A4').value='QUOTATION';ws.getCell('A4').font={bold:true,size:18,color:{argb:TEXT}};ws.getCell('A4').alignment={horizontal:'center',vertical:'middle'};ws.getRow(4).height=28;

 const left:[string,string][]=[['Quotation No.',q.quotation_no],['Date',c.quotationDate],['Validity',`${c.validityDays} Days`],['RFQ No.',c.rfqNo||'-'],['Sales PIC',c.salesName||'-'],['Email',c.salesEmail||'-'],['Phone Number',c.salesPhone||'-']];
 const right:[string,string][]=[['Attention',c.attention||'-'],['Client',c.clientName||'-'],['Address',c.address||'-']];
 const start=6;
 left.forEach(([k,v],i)=>{const r=start+i;ws.getCell(r,1).value=k;ws.getCell(r,2).value=':';ws.mergeCells(r,3,r,5);ws.getCell(r,3).value=v;ws.getCell(r,1).font={bold:true,color:{argb:TEXT}};ws.getCell(r,1).alignment={horizontal:'left',vertical:'top'};ws.getCell(r,2).alignment={horizontal:'center',vertical:'top'};ws.getCell(r,3).alignment={horizontal:'left',vertical:'top',wrapText:true};ws.getRow(r).height=13});
 right.forEach(([k,v],i)=>{const r=start+i;ws.getCell(r,7).value=k;ws.getCell(r,8).value=':';ws.mergeCells(r,9,r,11);ws.getCell(r,9).value=v;ws.getCell(r,7).font={bold:true,color:{argb:TEXT}};ws.getCell(r,7).alignment={horizontal:'left',vertical:'top'};ws.getCell(r,8).alignment={horizontal:'center',vertical:'top'};ws.getCell(r,9).alignment={horizontal:'left',vertical:'top',wrapText:true};if(k==='Address')ws.getRow(r).height=25});

 const headRow=14;const heads=['No','Item / Description','Specification','Brand','User','Lead Time (Days)','Qty','UOM','Unit Price','Amount','Remarks'];
 heads.forEach((h,i)=>{const cell=ws.getCell(headRow,i+1);cell.value=h;cell.font={bold:true,color:{argb:TEXT},size:10};cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:LIGHT}};cell.alignment={horizontal:'center',vertical:'middle',wrapText:true};cell.border={top:{style:'thin',color:{argb:GRID}},bottom:{style:'thin',color:{argb:GRID}}}});ws.getRow(headRow).height=27;
 c.items.forEach((it,idx)=>{const r=headRow+1+idx;const vals=[idx+1,it.productName,it.spec,it.brand,it.user,it.leadTime,it.qty,it.uom,it.unitPrice,it.qty*it.unitPrice,it.remarks];
  vals.forEach((v,i)=>{const cell=ws.getCell(r,i+1);cell.value=v as any;cell.border={bottom:{style:'thin',color:{argb:GRID}}};cell.alignment={vertical:'top',wrapText:true};if(idx%2)cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:ZEBRA}};
   if([0,1,2,3,4,10].includes(i))cell.alignment={vertical:'top',horizontal:i===0?'center':'left',wrapText:true};
   if(i===5||i===7)cell.alignment={vertical:'top',horizontal:'center',wrapText:true};
   if(i===6)cell.alignment={vertical:'top',horizontal:'right'};
   if(i===8||i===9){cell.numFmt='"IDR"* #,##0';cell.alignment={vertical:'top',horizontal:'right'}}
  });ws.getRow(r).height=28;
 });
 let r=headRow+Math.max(c.items.length,1)+2;const subtotal=subtotalAmount(c),vat=vatAmount(c),grand=totalAmount(c);
 const totals=[['Total Amount',subtotal],['Total VAT '+c.vatRate+'%',vat],['Total Amount Include VAT',grand]] as const;
 totals.forEach(([label,value],i)=>{const rr=r+i;ws.mergeCells(rr,7,rr,8);ws.getCell(rr,7).value=label;ws.getCell(rr,7).font={bold:true,color:{argb:TEXT}};ws.getCell(rr,7).alignment={horizontal:'left',vertical:'middle'};ws.getCell(rr,9).value='IDR';ws.getCell(rr,9).alignment={horizontal:'center'};ws.mergeCells(rr,10,rr,11);ws.getCell(rr,10).value=value;ws.getCell(rr,10).numFmt='#,##0';ws.getCell(rr,10).font={bold:true,color:{argb:TEXT}};ws.getCell(rr,10).alignment={horizontal:'right'};for(let cc=7;cc<=11;cc++)ws.getCell(rr,cc).border={top:{style:'thin',color:{argb:GRID}},bottom:{style:'thin',color:{argb:GRID}},left:{style:'thin',color:{argb:GRID}},right:{style:'thin',color:{argb:GRID}}}});
 r+=5;ws.mergeCells(r,1,r,6);ws.getCell(r,1).value='Notes';ws.getCell(r,1).font={bold:true,color:{argb:TEXT}};c.notes.forEach((n,i)=>{r++;ws.mergeCells(r,1,r,7);ws.getCell(r,1).value=`${i+1}. ${n}`;ws.getCell(r,1).alignment={wrapText:true,vertical:'top'}});
 const signRow=Math.max(r+2,headRow+c.items.length+8);ws.mergeCells(signRow,8,signRow,11);ws.getCell(signRow,8).value=`Jakarta, ${indonesiaToday()}`;ws.getCell(signRow,8).alignment={horizontal:'center'};ws.mergeCells(signRow+1,8,signRow+1,11);ws.getCell(signRow+1,8).value='President Director,';ws.getCell(signRow+1,8).alignment={horizontal:'center'};
 const sig=await signatureData(c.directorSignaturePath||'/signature-mr-herry.png');if(sig){const id=wb.addImage({buffer:sig.buffer as any,extension:sig.kind==='png'?'png':'jpeg'});ws.addImage(id,{tl:{col:7.7,row:signRow+1.5},ext:{width:160,height:70}})}
 ws.mergeCells(signRow+6,8,signRow+6,11);ws.getCell(signRow+6,8).value=c.directorName;ws.getCell(signRow+6,8).font={bold:true};ws.getCell(signRow+6,8).alignment={horizontal:'center'};
 ws.eachRow(row=>row.eachCell(cell=>{cell.font={name:'Arial',size:9.5,color:{argb:TEXT},...cell.font}}));const b=await wb.xlsx.writeBuffer();return Buffer.from(b)
}

type PdfCtx={page:PDFPage;regular:PDFFont;bold:PDFFont};
function pdfWrap(font:PDFFont,text:string,size:number,maxWidth:number){const words=String(text||'').split(/\s+/).filter(Boolean);const lines:string[]=[];let line='';for(const word of words){const next=(line+' '+word).trim();if(line&&font.widthOfTextAtSize(next,size)>maxWidth){lines.push(line);line=word}else line=next}if(line)lines.push(line);return lines.length?lines:['']}
function drawLines(ctx:PdfCtx,lines:string[],x:number,y:number,size:number,maxWidth:number,bold=false,align:'left'|'center'|'right'='left'){const font=bold?ctx.bold:ctx.regular;lines.forEach((line,i)=>{const w=font.widthOfTextAtSize(line,size);let xx=x;if(align==='center')xx=x+(maxWidth-w)/2;if(align==='right')xx=x+maxWidth-w;ctx.page.drawText(line,{x:xx,y:y-i*(size+2),size,font,color:rgb(.05,.05,.05)})})}

export async function quotationPdf(q:StoredQuotation){
 const c=q.content;const pdf=await PDFDocument.create();const regular=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);
 const A4:[number,number]=[595.28,841.89],margin=32;const black=rgb(.05,.05,.05),line=rgb(.78,.8,.83),headerFill=rgb(.955,.96,.965),zebra=rgb(.982,.985,.99);
 let page=pdf.addPage(A4);let ctx:PdfCtx={page,regular,bold};
 const logo=await signatureData('/serveone-logo.png');if(logo){try{const img=await pdf.embedPng(logo.buffer);page.drawImage(img,{x:margin,y:798,width:155,height:23.5})}catch{}}
 drawLines(ctx,[c.companyName],300,809,13.2,263,true,'right');drawLines(ctx,pdfWrap(regular,c.companyAddress,6.6,263),300,791,6.6,263,false,'right');
 drawLines(ctx,['QUOTATION'],margin,752,15.8,531,true,'center');

 const leftLabelX=36,leftColonX=109,leftValueX=119,leftValueW=157;const rightLabelX=304,rightColonX=365,rightValueX=375,rightValueW=188;
 const drawPair=(label:string,value:string,xLabel:number,xColon:number,xValue:number,y:number,valueWidth:number,size=7.5)=>{drawLines(ctx,[label],xLabel,y,size,xColon-xLabel-5,true,'left');drawLines(ctx,[':'],xColon-2,y,size,8,false,'center');const lines=pdfWrap(regular,value||'-',size,valueWidth);drawLines(ctx,lines,xValue,y,size,valueWidth,false,'left');return Math.max(1,lines.length)};
 const leftInfo:[string,string][]=[['Quotation No.',q.quotation_no],['Date',c.quotationDate],['Validity',`${c.validityDays} Days`],['RFQ No.',c.rfqNo||'-'],['Sales PIC',c.salesName||'-'],['Email',c.salesEmail||'-'],['Phone Number',c.salesPhone||'-']];
 let ly=723;for(const [label,value] of leftInfo){drawPair(label,value,leftLabelX,leftColonX,leftValueX,ly,leftValueW);ly-=9.8}
 const rightInfo:[string,string][]=[['Attention',c.attention||'-'],['Client',c.clientName||'-'],['Address',c.address||'-']];let ry=723;for(const [label,value] of rightInfo){const lines=drawPair(label,value,rightLabelX,rightColonX,rightValueX,ry,rightValueW);ry-=Math.max(10.2,lines*8.5)}
 page.drawLine({start:{x:291,y:726},end:{x:291,y:654},thickness:.45,color:line});

 let y=640;
 const cols=[
  {k:'no',h:'No',w:18,a:'center'},
  {k:'item',h:'Item / Description',w:72,a:'left'},
  {k:'spec',h:'Specification',w:86,a:'left'},
  {k:'brand',h:'Brand',w:38,a:'left'},
  {k:'user',h:'User',w:40,a:'left'},
  {k:'lead',h:'Lead Time\n(Days)',w:45,a:'center'},
  {k:'qty',h:'Qty',w:26,a:'right'},
  {k:'uom',h:'UOM',w:30,a:'center'},
  {k:'price',h:'Unit Price',w:52,a:'currency'},
  {k:'amount',h:'Amount',w:56,a:'currency'},
  {k:'remarks',h:'Remarks',w:68,a:'left'}
 ] as const;
 const tableW=cols.reduce((sum,col)=>sum+col.w,0);
 const drawHeader=()=>{page.drawRectangle({x:margin,y:y-25,width:tableW,height:25,color:headerFill});page.drawLine({start:{x:margin,y},end:{x:margin+tableW,y},thickness:.65,color:line});page.drawLine({start:{x:margin,y:y-25},end:{x:margin+tableW,y:y-25},thickness:.65,color:line});let x=margin;for(const col of cols){drawLines(ctx,col.h.split('\n'),x,y-9.5,6.8,col.w,true,'center');x+=col.w}y-=25};
 drawHeader();
 const cellLines=(v:string,size:number,w:number)=>pdfWrap(regular,v,size,Math.max(8,w-5));
 for(let i=0;i<c.items.length;i++){
  const it=c.items[i];const values:any={no:String(i+1),item:it.productName||'',spec:it.spec||'',brand:it.brand||'',user:it.user||'',lead:it.leadTime||'',qty:String(it.qty||''),uom:it.uom||'',price:it.unitPrice||0,amount:(it.qty||0)*(it.unitPrice||0),remarks:it.remarks||''};
  const textCols=cols.map(col=>col.a==='currency'?[]:cellLines(String(values[col.k]??''),7.15,col.w));const lineCount=Math.max(1,...textCols.map(lines=>lines.length));const rowH=Math.max(22,lineCount*9.2+5);
  if(y-rowH<155){page=pdf.addPage(A4);ctx={page,regular,bold};y=805;drawHeader()}
  if(i%2)page.drawRectangle({x:margin,y:y-rowH,width:tableW,height:rowH,color:zebra});page.drawLine({start:{x:margin,y:y-rowH},end:{x:margin+tableW,y:y-rowH},thickness:.5,color:line});
  let x=margin;for(let ci=0;ci<cols.length;ci++){const col=cols[ci];if(col.a==='currency'){drawLines(ctx,['IDR'],x+2,y-12,6.8,col.w-4,false,'left');drawLines(ctx,[money(values[col.k])],x+2,y-12,6.8,col.w-4,false,'right')}else drawLines(ctx,textCols[ci],x+2,y-11,7.15,col.w-4,false,col.a as 'left'|'center'|'right');x+=col.w}y-=rowH;
 }

 y-=10;if(y<130){page=pdf.addPage(A4);ctx={page,regular,bold};y=790}
 const subtotal=subtotalAmount(c),vat=vatAmount(c),grand=totalAmount(c);const totalW=250,totalX=margin+tableW-totalW,rowH=20,labelW=150,currencyW=30,amountW=70;const totals=[['Total Amount',subtotal],['Total VAT '+c.vatRate+'%',vat],['Total Amount Include VAT',grand]] as const;
 for(let i=0;i<totals.length;i++){const [label,value]=totals[i];const yy=y-i*rowH;page.drawRectangle({x:totalX,y:yy-rowH,width:totalW,height:rowH,borderColor:line,borderWidth:.55});page.drawLine({start:{x:totalX+labelW,y:yy},end:{x:totalX+labelW,y:yy-rowH},thickness:.45,color:line});page.drawLine({start:{x:totalX+labelW+currencyW,y:yy},end:{x:totalX+labelW+currencyW,y:yy-rowH},thickness:.45,color:line});drawLines(ctx,[label],totalX+6,yy-13,7.8,labelW-12,true,'left');drawLines(ctx,['IDR'],totalX+labelW,yy-13,7.5,currencyW,false,'center');drawLines(ctx,[money(value)],totalX+labelW+currencyW+4,yy-13,7.8,amountW-8,true,'right')}
 y-=rowH*3+14;
 drawLines(ctx,['Notes'],margin,y,8.4,250,true,'left');y-=14;for(let i=0;i<c.notes.length;i++){const lines=pdfWrap(regular,`${i+1}. ${c.notes[i]}`,7.4,330);drawLines(ctx,lines,margin,y,7.4,330,false,'left');y-=Math.max(12,lines.length*9.4)}
 const signatureTop=Math.max(98,y-4);drawLines(ctx,[`Jakarta, ${indonesiaToday()}`],365,signatureTop,7.8,180,false,'center');drawLines(ctx,['President Director,'],365,signatureTop-15,7.8,180,false,'center');const sig=await signatureData(c.directorSignaturePath||'/signature-mr-herry.png');if(sig){try{const img=sig.kind==='png'?await pdf.embedPng(sig.buffer):await pdf.embedJpg(sig.buffer);page.drawImage(img,{x:390,y:signatureTop-84,width:130,height:66})}catch{}}drawLines(ctx,[c.directorName],365,signatureTop-96,8.3,180,true,'center');
 return Buffer.from(await pdf.save())
}

export async function historyXlsx(rows:StoredQuotation[]){
 const wb=new ExcelJS.Workbook(),ws=wb.addWorksheet('Quotation List');ws.columns=[{header:'No',key:'list_no',width:8},{header:'Quotation No.',key:'quotation',width:24},{header:'Date',key:'date',width:14},{header:'Client',key:'client',width:28},{header:'Sales PIC',key:'sales',width:22},{header:'Item No',key:'item_no',width:8},{header:'Item / Description',key:'item',width:30},{header:'Specification',key:'spec',width:32},{header:'Brand',key:'brand',width:18},{header:'User',key:'user',width:18},{header:'Lead Time (Days)',key:'lead',width:16},{header:'Qty',key:'qty',width:10},{header:'UOM',key:'uom',width:10},{header:'Unit Price',key:'price',width:18},{header:'Amount',key:'amount',width:18},{header:'Remarks',key:'remarks',width:34}];
 rows.forEach((q,group)=>{const items=q.content?.items?.length?q.content.items:[null];items.forEach((item,index)=>{const row=ws.addRow({list_no:index===0?group+1:'',quotation:q.quotation_no,date:q.quotation_date,client:q.client_name,sales:q.sales_name,item_no:item?index+1:'',item:item?.productName||'',spec:item?.spec||'',brand:item?.brand||'',user:item?.user||'',lead:item?.leadTime||'',qty:item?.qty||'',uom:item?.uom||'',price:item?.unitPrice||'',amount:item?(item.qty||0)*(item.unitPrice||0):'',remarks:item?.remarks||''});if(group%2)row.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFF3F6FA'}}})});
 ws.getRow(1).font={bold:true,color:{argb:TEXT}};ws.getRow(1).fill={type:'pattern',pattern:'solid',fgColor:{argb:LIGHT}};ws.getRow(1).alignment={horizontal:'center',vertical:'middle',wrapText:true};ws.getColumn('price').numFmt='"IDR"* #,##0';ws.getColumn('amount').numFmt='"IDR"* #,##0';ws.autoFilter={from:'A1',to:'P1'};ws.views=[{state:'frozen',ySplit:1}];return Buffer.from(await wb.xlsx.writeBuffer())
}
