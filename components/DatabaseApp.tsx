'use client';

import {useEffect,useMemo,useState} from 'react';
import type {ClipboardEvent} from 'react';
import type {Director,SalesPerson} from '@/lib/types';
import UiIcon from './UiIcon';
import PaginationBar from './PaginationBar';
import LoadingOverlay from './LoadingOverlay';

type AttentionRow={id?:string;name:string;active:boolean};
type ClientGroup={client:string;address:string;active:boolean;attentions:AttentionRow[]};
type SalesDraftRow={name:string;email:string;phone:string;active:boolean};
type BatchClientRow={client:string;address:string;attention:string;active:boolean};

const BATCH_MAX=5000;
const BATCH_PAGE_SIZE=100;
const ATTENTION_MAX=1000;
const alpha=(a:string,b:string)=>a.localeCompare(b,undefined,{sensitivity:'base'});
const norm=(v:string)=>v.trim().toLocaleLowerCase();
const emptyAttention=():AttentionRow=>({name:'',active:true});
const emptySales=():SalesDraftRow=>({name:'',email:'',phone:'',active:true});
const emptyBatch=():BatchClientRow=>({client:'',address:'',attention:'',active:true});
const tenAttention=()=>Array.from({length:10},emptyAttention);
const tenSales=()=>Array.from({length:10},emptySales);
const tenBatch=()=>Array.from({length:10},emptyBatch);
const padAttention=(rows:AttentionRow[],minimum=10)=>[
 ...rows.map(x=>({...x})),
 ...Array.from({length:Math.max(0,minimum-rows.length)},emptyAttention),
].slice(0,ATTENTION_MAX);

function BatchPager({page,total,onChange}:{page:number;total:number;onChange:(p:number)=>void}){
 const pages=Math.max(1,Math.ceil(total/BATCH_PAGE_SIZE));
 const safe=Math.min(Math.max(1,page),pages);
 const first=total?((safe-1)*BATCH_PAGE_SIZE+1):0;
 const last=Math.min(total,safe*BATCH_PAGE_SIZE);
 return <div className="batch-pager">
  <span>{first}-{last} of {total}</span>
  <div>
   <button type="button" className="icon-only-button" title="Previous" disabled={safe<=1} onClick={()=>onChange(safe-1)}><UiIcon name="chevronLeft" size={16}/></button>
   <b>{safe} / {pages}</b>
   <button type="button" className="icon-only-button" title="Next" disabled={safe>=pages} onClick={()=>onChange(safe+1)}><UiIcon name="chevronRight" size={16}/></button>
  </div>
 </div>
}

function mergeBatchClients(current:ClientGroup[],rows:BatchClientRow[]){
 const map=new Map<string,ClientGroup>();
 current.forEach(c=>map.set(norm(c.client),{...c,attentions:c.attentions.map(a=>({...a}))}));
 for(const row of rows){
  const client=row.client.trim(),attention=row.attention.trim();
  if(!client||!attention)continue;
  const key=norm(client);
  const group=map.get(key)||{client,address:row.address.trim(),active:true,attentions:[]};
  if(row.address.trim())group.address=row.address.trim();
  const existing=group.attentions.find(a=>norm(a.name)===norm(attention));
  if(existing)existing.active=row.active!==false;
  else group.attentions.push({name:attention,active:row.active!==false});
  group.attentions.sort((a,b)=>alpha(a.name,b.name));
  group.active=group.attentions.some(a=>a.active);
  map.set(key,group);
 }
 return [...map.values()].sort((a,b)=>alpha(a.client,b.client));
}

export default function DatabaseApp(){
 const [clients,setClients]=useState<ClientGroup[]>([]);
 const [sales,setSales]=useState<SalesPerson[]>([]);
 const [directors,setDirectors]=useState<Director[]>([]);
 const [search,setSearch]=useState('');
 const [page,setPage]=useState(1);
 const [pageSize,setPageSize]=useState(15);
 const [msg,setMsg]=useState('');
 const [busy,setBusy]=useState(false);
 const [loading,setLoading]=useState(true);

 const [clientModal,setClientModal]=useState(false);
 const [originalClient,setOriginalClient]=useState('');
 const [draftClient,setDraftClient]=useState<ClientGroup>({client:'',address:'',active:true,attentions:tenAttention()});
 const [attentionRowsToAdd,setAttentionRowsToAdd]=useState(10);

 const [batchModal,setBatchModal]=useState(false);
 const [batchRows,setBatchRows]=useState<BatchClientRow[]>(tenBatch());
 const [batchRowsToAdd,setBatchRowsToAdd]=useState(10);
 const [batchPage,setBatchPage]=useState(1);

 const [salesModal,setSalesModal]=useState(false);
 const [salesDraft,setSalesDraft]=useState<SalesDraftRow[]>(tenSales());
 const [salesRowsToAdd,setSalesRowsToAdd]=useState(10);
 const [salesBatchPage,setSalesBatchPage]=useState(1);

 const [dirtySales,setDirtySales]=useState<Set<string>>(new Set());
 const [dirtyDirectors,setDirtyDirectors]=useState<Set<string>>(new Set());

 async function load(){
  setLoading(true);
  try{
   const [cr,mr]=await Promise.all([
    fetch('/api/clients',{cache:'no-store'}),
    fetch('/api/masters?scope=core',{cache:'no-store'}),
   ]);
   const [cj,mj]=await Promise.all([cr.json(),mr.json()]);
   if(!cr.ok)throw new Error(cj.error||'Failed to load Client Data');
   if(!mr.ok)throw new Error(mj.error||'Failed to load master data');
   setClients((cj||[]).sort((a:ClientGroup,b:ClientGroup)=>alpha(a.client,b.client)));
   setSales((mj.sales||[]).sort((a:SalesPerson,b:SalesPerson)=>alpha(a.name,b.name)));
   setDirectors((mj.directors||[]).sort((a:Director,b:Director)=>alpha(a.name,b.name)));
   setDirtySales(new Set());
   setDirtyDirectors(new Set());
  }catch(e){setMsg(e instanceof Error?e.message:'Failed to load Master Data')}
  finally{setLoading(false)}
 }
 useEffect(()=>{void load()},[]);

 const filtered=useMemo(()=>{
  const q=search.trim().toLowerCase();
  return clients.filter(c=>!q||[c.client,c.address,...c.attentions.map(a=>a.name)].join(' ').toLowerCase().includes(q));
 },[clients,search]);
 const totalPages=Math.max(1,Math.ceil(filtered.length/pageSize));
 const safePage=Math.min(page,totalPages);
 const paged=filtered.slice((safePage-1)*pageSize,safePage*pageSize);
 useEffect(()=>{if(page>totalPages)setPage(totalPages)},[page,totalPages]);

 function openNewClient(){
  setOriginalClient('');
  setDraftClient({client:'',address:'',active:true,attentions:tenAttention()});
  setAttentionRowsToAdd(10);
  setClientModal(true);
 }
 function openEditClient(c:ClientGroup){
  setOriginalClient(c.client);
  setDraftClient({client:c.client,address:c.address||'',active:c.active,attentions:padAttention(c.attentions)});
  setAttentionRowsToAdd(10);
  setClientModal(true);
 }
 function matchExistingClient(name:string){
  const found=clients.find(c=>norm(c.client)===norm(name));
  if(found&&!originalClient){
   setOriginalClient(found.client);
   setDraftClient({client:found.client,address:found.address||'',active:found.active,attentions:padAttention(found.attentions)});
  }else setDraftClient(d=>({...d,client:name}));
 }
 function patchAttention(i:number,key:keyof AttentionRow,v:string|boolean){
  setDraftClient(d=>({...d,attentions:d.attentions.map((a,j)=>j===i?{...a,[key]:v}:a)}));
 }
 function addAttentionRows(){
  const room=Math.max(0,ATTENTION_MAX-draftClient.attentions.length);
  const count=Math.min(room,Math.max(1,attentionRowsToAdd));
  if(count)setDraftClient(d=>({...d,attentions:[...d.attentions,...Array.from({length:count},emptyAttention)]}));
 }
 function removeAttention(i:number){
  setDraftClient(d=>({...d,attentions:d.attentions.length<=10?d.attentions.map((a,j)=>j===i?emptyAttention():a):d.attentions.filter((_,j)=>j!==i)}));
 }
 function pasteAttention(e:ClipboardEvent<HTMLInputElement>,rowIndex:number,startCol:0|1){
  const raw=e.clipboardData.getData('text/plain');if(!raw.includes('\t')&&!raw.includes('\n'))return;e.preventDefault();
  const matrix=raw.replace(/\r/g,'').split('\n').filter((x,i,a)=>x||i<a.length-1).map(x=>x.split('\t'));
  setDraftClient(d=>{const rows=d.attentions.map(x=>({...x}));while(rows.length<Math.min(ATTENTION_MAX,rowIndex+matrix.length))rows.push(emptyAttention());matrix.forEach((line,ri)=>{const target=rowIndex+ri;if(target>=ATTENTION_MAX)return;line.forEach((value,ci)=>{const col=startCol+ci;if(col===0)rows[target].name=value})});return {...d,attentions:rows}});
 }
 async function saveClient(){
  setBusy(true);setMsg('');
  try{
   const method=originalClient?'PATCH':'POST';
   const payload={...draftClient,originalClient:originalClient||undefined,attentions:draftClient.attentions.filter(a=>a.name.trim()).sort((a,b)=>alpha(a.name,b.name))};
   const r=await fetch('/api/clients',{method,headers:{'content-type':'application/json'},body:JSON.stringify(payload)}),j=await r.json();
   if(!r.ok)throw new Error(j.error||'Failed to save client');
   setClientModal(false);setMsg(`${draftClient.client} saved.`);await load();
  }catch(e){setMsg(e instanceof Error?e.message:'Failed to save client')}finally{setBusy(false)}
 }
 async function deleteClient(c:ClientGroup){
  if(!confirm(`Delete ${c.client} and all Attention data?`))return;
  setBusy(true);
  try{const r=await fetch('/api/clients',{method:'DELETE',headers:{'content-type':'application/json'},body:JSON.stringify({client:c.client})}),j=await r.json();if(!r.ok)throw new Error(j.error||'Delete failed');setClients(x=>x.filter(v=>norm(v.client)!==norm(c.client)));setMsg(`${c.client} deleted.`)}catch(e){setMsg(e instanceof Error?e.message:'Delete failed')}finally{setBusy(false)}
 }

 function patchBatch(i:number,key:keyof BatchClientRow,v:string|boolean){setBatchRows(rows=>rows.map((r,j)=>j===i?{...r,[key]:v}:r))}
 function addBatchRows(){
  setBatchRows(rows=>{const count=Math.min(BATCH_MAX-rows.length,Math.max(1,batchRowsToAdd));const next=[...rows,...Array.from({length:Math.max(0,count)},emptyBatch)];setBatchPage(Math.ceil(next.length/BATCH_PAGE_SIZE));return next});
 }
 function removeBatchRow(i:number){setBatchRows(rows=>rows.length<=10?rows.map((r,j)=>j===i?emptyBatch():r):rows.filter((_,j)=>j!==i))}
 function pasteBatch(e:ClipboardEvent<HTMLInputElement>,rowIndex:number,startCol:0|1|2){
  const raw=e.clipboardData.getData('text/plain');if(!raw.includes('\t')&&!raw.includes('\n'))return;e.preventDefault();
  const matrix=raw.replace(/\r/g,'').split('\n').filter((x,i,a)=>x||i<a.length-1).map(x=>x.split('\t'));
  setBatchRows(current=>{const rows=current.map(x=>({...x}));while(rows.length<Math.min(BATCH_MAX,rowIndex+matrix.length))rows.push(emptyBatch());matrix.forEach((line,ri)=>{const target=rowIndex+ri;if(target>=BATCH_MAX)return;line.forEach((value,ci)=>{const col=startCol+ci;if(col===0)rows[target].client=value;if(col===1)rows[target].address=value;if(col===2)rows[target].attention=value})});return rows});
 }
 async function saveBatch(){
  const rows=batchRows.filter(r=>r.client.trim()||r.address.trim()||r.attention.trim());
  if(!rows.length)return setMsg('Paste at least one batch row.');
  if(rows.find(r=>!r.client.trim()||!r.attention.trim()))return setMsg('Client and Attention are required for each batch row.');
  setBusy(true);
  try{
   const r=await fetch('/api/clients',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({batch:rows})}),j=await r.json();
   if(!r.ok)throw new Error(j.error||'Batch add failed');
   setClients(current=>mergeBatchClients(current,rows));
   setBatchModal(false);setBatchRows(tenBatch());setBatchPage(1);
   setMsg(`Batch saved: ${j.inserted||0} Attention added, ${j.updated||0} updated, ${j.skipped||0} duplicate(s) skipped.`);
  }catch(e){setMsg(e instanceof Error?e.message:'Batch add failed')}finally{setBusy(false)}
 }

 function patchSales(id:string,key:keyof SalesPerson,v:unknown){setSales(old=>old.map(x=>x.id===id?{...x,[key]:v}:x));setDirtySales(old=>new Set(old).add(id))}
 function patchDirector(id:string,key:keyof Director,v:unknown){setDirectors(old=>old.map(x=>x.id===id?{...x,[key]:v}:x));setDirtyDirectors(old=>new Set(old).add(id))}
 async function saveEntity(entity:'sales'|'directors',row:SalesPerson|Director,method:'POST'|'PATCH'='PATCH'){
  const payload={...row};if(method==='POST')delete (payload as any).id;
  const r=await fetch('/api/database',{method,headers:{'content-type':'application/json'},body:JSON.stringify({entity,row:payload})}),j=await r.json();if(!r.ok)throw new Error(j.error||'Save failed');return j;
 }
 async function saveSalesChanges(){
  const rows=sales.filter(x=>dirtySales.has(x.id));if(!rows.length)return setMsg('No Sales PIC changes to save.');
  setBusy(true);try{const r=await fetch('/api/database',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({entity:'sales',rows})}),j=await r.json();if(!r.ok)throw new Error(j.error||'Save failed');setSales((j.rows||sales).sort((a:SalesPerson,b:SalesPerson)=>alpha(a.name,b.name)));setDirtySales(new Set());setMsg(`Saved ${rows.length} Sales PIC change(s).`)}catch(e){setMsg(e instanceof Error?e.message:'Save failed')}finally{setBusy(false)}
 }
 function patchSalesDraft(i:number,key:keyof SalesDraftRow,value:string|boolean){setSalesDraft(rows=>rows.map((r,j)=>j===i?{...r,[key]:value}:r))}
 function addSalesRows(){
  setSalesDraft(rows=>{const count=Math.min(BATCH_MAX-rows.length,Math.max(1,salesRowsToAdd));const next=[...rows,...Array.from({length:Math.max(0,count)},emptySales)];setSalesBatchPage(Math.ceil(next.length/BATCH_PAGE_SIZE));return next});
 }
 function removeSalesDraft(i:number){setSalesDraft(rows=>rows.length<=10?rows.map((r,j)=>j===i?emptySales():r):rows.filter((_,j)=>j!==i))}
 function pasteSales(e:ClipboardEvent<HTMLInputElement>,rowIndex:number,startCol:0|1|2){
  const raw=e.clipboardData.getData('text/plain');if(!raw.includes('\t')&&!raw.includes('\n'))return;e.preventDefault();
  const matrix=raw.replace(/\r/g,'').split('\n').filter((x,i,a)=>x||i<a.length-1).map(x=>x.split('\t'));
  setSalesDraft(current=>{const rows=current.map(x=>({...x}));while(rows.length<Math.min(BATCH_MAX,rowIndex+matrix.length))rows.push(emptySales());matrix.forEach((line,ri)=>{const target=rowIndex+ri;if(target>=BATCH_MAX)return;line.forEach((value,ci)=>{const col=startCol+ci;if(col===0)rows[target].name=value;if(col===1)rows[target].email=value;if(col===2)rows[target].phone=value})});return rows});
 }
 async function addSales(){
  const rows=salesDraft.filter(r=>r.name.trim()||r.email.trim()||r.phone.trim());
  if(!rows.length)return setMsg('Paste at least one Sales PIC row.');
  if(rows.find(r=>!r.name.trim()||!r.email.trim()||!r.phone.trim()))return setMsg('Name, Email, and Phone are required for every Sales PIC row.');
  setBusy(true);
  try{
   const r=await fetch('/api/database',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({entity:'sales',rows})}),j=await r.json();
   if(!r.ok)throw new Error(j.error||'Batch Sales PIC failed');
   setSales((j.rows||[]).sort((a:SalesPerson,b:SalesPerson)=>alpha(a.name,b.name)));
   setSalesModal(false);setSalesDraft(tenSales());setSalesBatchPage(1);
   setMsg(`Sales PIC batch saved: ${j.inserted||0} added, ${j.updated||0} updated, ${j.skipped||0} duplicate(s) skipped.`);
  }catch(e){setMsg(e instanceof Error?e.message:'Failed to batch add Sales PIC')}finally{setBusy(false)}
 }
 async function saveDirectorChanges(){
  const rows=directors.filter(x=>dirtyDirectors.has(x.id));if(!rows.length)return setMsg('No signatory changes to save.');
  setBusy(true);try{for(const row of rows)await saveEntity('directors',row);setDirtyDirectors(new Set());setMsg(`Saved ${rows.length} signatory change(s).`)}catch(e){setMsg(e instanceof Error?e.message:'Save failed')}finally{setBusy(false)}
 }
 async function deleteEntity(entity:'sales'|'directors',id:string){
  if(!confirm('Delete this row?'))return;setBusy(true);
  try{const r=await fetch('/api/database',{method:'DELETE',headers:{'content-type':'application/json'},body:JSON.stringify({entity,id})});if(!r.ok)throw new Error('Delete failed');if(entity==='sales')setSales(x=>x.filter(v=>v.id!==id));else setDirectors(x=>x.filter(v=>v.id!==id))}catch(e){setMsg(e instanceof Error?e.message:'Delete failed')}finally{setBusy(false)}
 }

 const batchStart=(Math.max(1,batchPage)-1)*BATCH_PAGE_SIZE;
 const batchVisible=batchRows.slice(batchStart,batchStart+BATCH_PAGE_SIZE);
 const salesStart=(Math.max(1,salesBatchPage)-1)*BATCH_PAGE_SIZE;
 const salesVisible=salesDraft.slice(salesStart,salesStart+BATCH_PAGE_SIZE);

 return <>
  <LoadingOverlay show={loading||busy} label={busy?'Saving data...':'Loading Master Data...'}/>
  <header className="page-head"><div><h1>Master Data</h1><p>Manage Client Data, Sales PIC, and signatory data used by Create Quotation.</p></div></header>
  {msg&&<div className="notice">{msg}</div>}

  <section className="panel db-section">
   <div className="panel-title"><div><h2>Client Data</h2><p>Client and Address are stored once. Attention can be added individually or in batch.</p></div><div className="client-toolbar"><div className="member-search"><UiIcon name="search"/><input placeholder="Search client / attention" value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}}/></div><button className="btn ghost" onClick={()=>{setBatchRows(tenBatch());setBatchRowsToAdd(10);setBatchPage(1);setBatchModal(true)}}>Batch Add</button><button className="btn primary" onClick={openNewClient}>+ Add Client</button></div></div>
   <div className="history-wrap"><table className="db-table master-grid client-group-table zebra-grid"><thead><tr><th className="rowno">No</th><th>Client</th><th>Address</th><th>Attention</th><th>Action</th></tr></thead><tbody>{paged.length?paged.map((c,i)=><tr key={c.client}><td className="rowno">{(safePage-1)*pageSize+i+1}</td><td>{c.client}</td><td className="client-address-cell">{c.address||''}</td><td>{c.attentions.filter(a=>a.active).length}</td><td className="client-actions action-center"><button className="icon-only-button" title="Edit client" aria-label={`Edit ${c.client}`} onClick={()=>openEditClient(c)}><UiIcon name="edit" size={16}/></button><button className="x-button" title="Delete client" onClick={()=>deleteClient(c)}><UiIcon name="remove" size={15}/></button></td></tr>):<tr><td colSpan={5} className="empty-table">No Client Data found.</td></tr>}</tbody></table></div>
   <PaginationBar page={safePage} pageSize={pageSize} total={filtered.length} onPageChange={setPage} onPageSizeChange={s=>{setPageSize(s);setPage(1)}}/>
  </section>

  <section className="panel db-section"><div className="panel-title"><div><h2>Sales PIC</h2><p>Sorted automatically by Name. Maximum 10 rows are visible before scrolling.</p></div><div className="table-actions"><button className="btn ghost" onClick={()=>{setSalesDraft(tenSales());setSalesRowsToAdd(10);setSalesBatchPage(1);setSalesModal(true)}}>Batch Add PIC</button><button className="btn primary" disabled={busy} onClick={saveSalesChanges}>Save Changes</button></div></div><div className="sales-scroll"><table className="db-table master-grid compact-db zebra-grid"><thead><tr><th className="rowno">No</th><th>Name</th><th>Email</th><th>Phone</th><th>Action</th></tr></thead><tbody>{sales.map((row,i)=><tr key={row.id}><td className="rowno">{i+1}</td><td><input value={row.name||''} onChange={e=>patchSales(row.id,'name',e.target.value)}/></td><td><input value={row.email||''} onChange={e=>patchSales(row.id,'email',e.target.value)}/></td><td><input value={row.phone||''} onChange={e=>patchSales(row.id,'phone',e.target.value)}/></td><td className="action-center"><button className="x-button" title="Delete Sales PIC" onClick={()=>deleteEntity('sales',row.id)}><UiIcon name="remove" size={15}/></button></td></tr>)}</tbody></table></div></section>

  <section className="panel signatory-section"><div className="panel-title"><div><h2>President Director</h2><p>All fields remain editable.</p></div><button className="btn primary" disabled={busy} onClick={saveDirectorChanges}>Save Changes</button></div><div className="signatory-layout"><div className="history-wrap"><table className="db-table master-grid compact-db zebra-grid"><thead><tr><th>Name</th><th>Title</th><th>Action</th></tr></thead><tbody>{directors.map(row=><tr key={row.id}><td><input value={row.name||''} onChange={e=>patchDirector(row.id,'name',e.target.value)}/></td><td><input value={row.title||''} onChange={e=>patchDirector(row.id,'title',e.target.value)}/></td><td className="action-center"><button className="x-button" title="Delete signatory" onClick={()=>deleteEntity('directors',row.id)}><UiIcon name="remove" size={15}/></button></td></tr>)}</tbody></table></div><div className="signature-preview"><span>Signature Preview</span><img src="/signature-mr-herry.png" alt="President Director signature"/></div></div></section>

  {clientModal&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setClientModal(false)}}><div className="modal-card client-modal"><div className="modal-head"><div><h2>{originalClient?'Edit Client':'Add Client'}</h2><p>Client and Address are entered once. Add or paste Attention rows below.</p></div><button className="x-button" onClick={()=>setClientModal(false)}><UiIcon name="remove"/></button></div><div className="modal-fields"><label>Client<input value={draftClient.client} onChange={e=>matchExistingClient(e.target.value)} placeholder="Client name"/></label><label>Address<textarea rows={3} value={draftClient.address||''} onChange={e=>setDraftClient(d=>({...d,address:e.target.value}))} placeholder="Client address"/></label></div><div className="attention-head"><div><h3>Attention</h3><small>{draftClient.attentions.length}/{ATTENTION_MAX} rows</small></div><div className="add-many"><input aria-label="Attention rows to add" type="number" min="1" max={ATTENTION_MAX} value={attentionRowsToAdd} onChange={e=>setAttentionRowsToAdd(Math.min(ATTENTION_MAX,Math.max(1,Number(e.target.value)||10)))}/><button className="btn ghost small" onClick={addAttentionRows} disabled={draftClient.attentions.length>=ATTENTION_MAX}>+ Add Rows</button></div></div><div className="attention-scroll"><table className="db-table master-grid editable-grid zebra-grid"><thead><tr><th className="rowno">No</th><th>Attention</th><th>Action</th></tr></thead><tbody>{draftClient.attentions.map((a,i)=><tr key={a.id||i}><td className="rowno">{i+1}</td><td><input value={a.name} onPaste={e=>pasteAttention(e,i,0)} onChange={e=>patchAttention(i,'name',e.target.value)}/></td><td className="action-center"><button className="x-button" onClick={()=>removeAttention(i)}><UiIcon name="remove" size={14}/></button></td></tr>)}</tbody></table></div><div className="modal-actions"><button className="btn ghost" onClick={()=>setClientModal(false)}>Cancel</button><button className="btn primary" disabled={busy} onClick={saveClient}>{busy?'Saving...':'Save Client'}</button></div></div></div>}

  {batchModal&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setBatchModal(false)}}><div className="modal-card batch-client-modal"><div className="modal-head"><div><h2>Batch Add Client Data</h2><p>Paste Client, Address, and Attention from Excel. Up to 5,000 rows; only 100 are rendered at a time for speed.</p></div><button className="x-button" onClick={()=>setBatchModal(false)}><UiIcon name="remove"/></button></div><div className="attention-head"><div><h3>Client rows</h3><small>{batchRows.length.toLocaleString('id-ID')}/{BATCH_MAX.toLocaleString('id-ID')} rows</small></div><div className="add-many"><input aria-label="Batch client rows to add" type="number" min="1" max={BATCH_MAX} value={batchRowsToAdd} onChange={e=>setBatchRowsToAdd(Math.min(BATCH_MAX,Math.max(1,Number(e.target.value)||10)))}/><button className="btn ghost small" onClick={addBatchRows} disabled={batchRows.length>=BATCH_MAX}>+ Add Rows</button></div></div><BatchPager page={batchPage} total={batchRows.length} onChange={setBatchPage}/><div className="batch-scroll"><table className="db-table master-grid editable-grid zebra-grid"><thead><tr><th className="rowno">No</th><th>Client</th><th>Address</th><th>Attention</th><th>Action</th></tr></thead><tbody>{batchVisible.map((row,i)=>{const idx=batchStart+i;return <tr key={idx}><td className="rowno">{idx+1}</td><td><input value={row.client} onPaste={e=>pasteBatch(e,idx,0)} onChange={e=>patchBatch(idx,'client',e.target.value)}/></td><td><input value={row.address} onPaste={e=>pasteBatch(e,idx,1)} onChange={e=>patchBatch(idx,'address',e.target.value)}/></td><td><input value={row.attention} onPaste={e=>pasteBatch(e,idx,2)} onChange={e=>patchBatch(idx,'attention',e.target.value)}/></td><td className="action-center"><button className="x-button" onClick={()=>removeBatchRow(idx)}><UiIcon name="remove" size={14}/></button></td></tr>})}</tbody></table></div><BatchPager page={batchPage} total={batchRows.length} onChange={setBatchPage}/><div className="modal-actions"><button className="btn ghost" onClick={()=>setBatchModal(false)}>Cancel</button><button className="btn primary" disabled={busy} onClick={saveBatch}>{busy?'Saving...':'Save Batch'}</button></div></div></div>}

  {salesModal&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setSalesModal(false)}}><div className="modal-card batch-client-modal"><div className="modal-head"><div><h2>Batch Add Sales PIC</h2><p>Paste Name, Email, and Phone from Excel. Up to 5,000 rows; existing names are updated instead of duplicated.</p></div><button className="x-button" onClick={()=>setSalesModal(false)}><UiIcon name="remove"/></button></div><div className="attention-head"><div><h3>Sales PIC rows</h3><small>{salesDraft.length.toLocaleString('id-ID')}/{BATCH_MAX.toLocaleString('id-ID')} rows</small></div><div className="add-many"><input aria-label="Sales rows to add" type="number" min="1" max={BATCH_MAX} value={salesRowsToAdd} onChange={e=>setSalesRowsToAdd(Math.min(BATCH_MAX,Math.max(1,Number(e.target.value)||10)))}/><button className="btn ghost small" onClick={addSalesRows} disabled={salesDraft.length>=BATCH_MAX}>+ Add Rows</button></div></div><BatchPager page={salesBatchPage} total={salesDraft.length} onChange={setSalesBatchPage}/><div className="batch-scroll"><table className="db-table master-grid editable-grid zebra-grid"><thead><tr><th className="rowno">No</th><th>Name</th><th>Email</th><th>Phone</th><th>Action</th></tr></thead><tbody>{salesVisible.map((row,i)=>{const idx=salesStart+i;return <tr key={idx}><td className="rowno">{idx+1}</td><td><input value={row.name} onPaste={e=>pasteSales(e,idx,0)} onChange={e=>patchSalesDraft(idx,'name',e.target.value)}/></td><td><input value={row.email} onPaste={e=>pasteSales(e,idx,1)} onChange={e=>patchSalesDraft(idx,'email',e.target.value)}/></td><td><input value={row.phone} onPaste={e=>pasteSales(e,idx,2)} onChange={e=>patchSalesDraft(idx,'phone',e.target.value)}/></td><td className="action-center"><button className="x-button" onClick={()=>removeSalesDraft(idx)}><UiIcon name="remove" size={14}/></button></td></tr>})}</tbody></table></div><BatchPager page={salesBatchPage} total={salesDraft.length} onChange={setSalesBatchPage}/><div className="modal-actions"><button className="btn ghost" onClick={()=>setSalesModal(false)}>Cancel</button><button className="btn primary" disabled={busy} onClick={addSales}>{busy?'Saving...':'Save Batch'}</button></div></div></div>}
 </>
}
