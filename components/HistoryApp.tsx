'use client';
import {useEffect,useMemo,useState} from 'react';
import {useRouter} from 'next/navigation';
import MultiCheckFilter from './MultiCheckFilter';
import UiIcon from './UiIcon';
import PaginationBar from './PaginationBar';
import SearchPopover from './SearchPopover';
import LoadingOverlay from './LoadingOverlay';
import ConfirmDialog from './ConfirmDialog';
import type {QuoteItem,StoredQuotation} from '@/lib/types';

const idr=new Intl.NumberFormat('id-ID');
const baseKey=(q:StoredQuotation)=>String(q.base_quotation_no||q.quotation_no.replace(/\/REV-\d+$/i,''));
const revNo=(q:StoredQuotation)=>Number(q.revision_no||0);

const compactAmount=(value:number)=>{
 if(!Number.isFinite(value)) return '0';
 const abs=Math.abs(value);
 const sign=value<0?'-':'';
 const fmt=(n:number)=>{const rounded=Math.round(n*100)/100;return String(rounded).replace(/\.0+$/,'').replace(/(\.\d*[1-9])0+$/,'$1')};
 if(abs>=1_000_000_000) return `${sign}${fmt(abs/1_000_000_000)}B`;
 if(abs>=1_000_000) return `${sign}${fmt(abs/1_000_000)}M`;
 if(abs>=1_000) return `${sign}${fmt(abs/1_000)}K`;
 return `${sign}${idr.format(abs)}`;
};
type HistoryItemRow={quote:StoredQuotation;item:QuoteItem|null;itemIndex:number;groupIndex:number;rowSpan:number};

export default function HistoryApp(){
 const router=useRouter();
 const [rows,setRows]=useState<StoredQuotation[]>([]),[search,setSearch]=useState(''),[appliedSearch,setAppliedSearch]=useState(''),[sales,setSales]=useState<string[]>([]),[clients,setClients]=useState<string[]>([]),[loading,setLoading]=useState(true),[loadingLabel,setLoadingLabel]=useState('Loading Quotation List...'),[msg,setMsg]=useState('');
 const [page,setPage]=useState(1),[pageSize,setPageSize]=useState(15),[selectedIds,setSelectedIds]=useState<Set<string>>(new Set());
 const [deleteConfirm,setDeleteConfirm]=useState(false);
 async function load(){setLoadingLabel('Loading Quotation List...');setLoading(true);try{const r=await fetch('/api/history',{cache:'no-store'}),j=await r.json();if(r.ok)setRows(j);else setMsg(j.error||'Failed to load')}finally{setLoading(false)}}
 useEffect(()=>{void load()},[]);
 const searchTerms=useMemo(()=>appliedSearch.split(/\r?\n/).map(x=>x.trim().toLowerCase()).filter(Boolean),[appliedSearch]);
 const passSearch=(r:StoredQuotation)=>{if(!searchTerms.length)return true;const blob=[r.quotation_no,r.base_quotation_no,r.quotation_date,r.client_name,r.sales_name,r.total_amount,r.content?.attention,r.content?.address,r.content?.rfqNo,...(r.content?.items||[]).flatMap(i=>[i.code,i.productName,i.spec,i.brand,i.user,i.leadTime,i.leadTimeUnit,i.qty,i.uom,i.unitPrice,(i.qty||0)*(i.unitPrice||0),i.remarks]),...(r.content?.notes||[])].join(' ').toLowerCase();return searchTerms.some(t=>blob.includes(t))};
 const baseForSales=useMemo(()=>rows.filter(r=>passSearch(r)&&(clients.length===0||clients.includes(r.client_name))),[rows,searchTerms.join('|'),clients.join('|')]);
 const baseForClients=useMemo(()=>rows.filter(r=>passSearch(r)&&(sales.length===0||sales.includes(r.sales_name))),[rows,searchTerms.join('|'),sales.join('|')]);
 const salesOptions=useMemo<string[]>(()=>[...new Set<string>(baseForSales.map(r=>String(r.sales_name||'')).filter(Boolean))].sort((a,b)=>a.localeCompare(b,undefined,{sensitivity:'base'})),[baseForSales]);
 const clientOptions=useMemo<string[]>(()=>[...new Set<string>(baseForClients.map(r=>String(r.client_name||'')).filter(Boolean))].sort((a,b)=>a.localeCompare(b,undefined,{sensitivity:'base'})),[baseForClients]);
 const filtered=useMemo(()=>rows.filter(r=>passSearch(r)&&(sales.length===0||sales.includes(r.sales_name))&&(clients.length===0||clients.includes(r.client_name))),[rows,searchTerms.join('|'),sales.join('|'),clients.join('|')]);
 const groupCounts=useMemo(()=>{const m=new Map<string,number>();for(const r of rows){const k=baseKey(r);m.set(k,(m.get(k)||0)+1)}return m},[rows]);
 const latestByBase=useMemo(()=>{const m=new Map<string,StoredQuotation>();for(const r of rows){const k=baseKey(r),cur=m.get(k);if(!cur||revNo(r)>revNo(cur)||(revNo(r)===revNo(cur)&&String(r.created_at)>String(cur.created_at)))m.set(k,r)}return m},[rows]);
 const matchedBases=useMemo(()=>new Set(filtered.map(baseKey)),[filtered]);
 const latestForFiltered=useMemo(()=>[...latestByBase.entries()].filter(([k])=>matchedBases.has(k)).map(([,r])=>r),[latestByBase,matchedBases]);
 const summary=useMemo(()=>({quotes:latestForFiltered.length,amount:latestForFiltered.reduce((sum,r)=>sum+(r.content?.items||[]).reduce((s,item)=>s+(Number(item.qty)||0)*(Number(item.unitPrice)||0),0),0),clients:new Set(latestForFiltered.map(r=>r.client_name).filter(Boolean)).size}),[latestForFiltered]);
 const totalPages=Math.max(1,Math.ceil(filtered.length/pageSize)),safePage=Math.min(page,totalPages),pageQuotes=filtered.slice((safePage-1)*pageSize,safePage*pageSize);
 const tableRows=useMemo(()=>pageQuotes.flatMap<HistoryItemRow>((quote,groupIndex)=>{const items=quote.content?.items?.length?quote.content.items:[null];return items.map((item,itemIndex)=>({quote,item,itemIndex,groupIndex,rowSpan:items.length}))}),[pageQuotes]);
 const selectedQuotes=useMemo(()=>filtered.filter(q=>selectedIds.has(q.id)),[filtered,selectedIds]);
 const pageIds=useMemo(()=>pageQuotes.map(q=>q.id),[pageQuotes]);
 const allPageSelected=pageIds.length>0&&pageIds.every(id=>selectedIds.has(id));
 useEffect(()=>{if(page>totalPages)setPage(totalPages)},[page,totalPages]);
 useEffect(()=>{const allowed=new Set(filtered.map(q=>q.id));setSelectedIds(current=>{const next=new Set([...current].filter(id=>allowed.has(id)));return next.size===current.size&&[...next].every(id=>current.has(id))?current:next})},[filtered]);
 async function download(mode:'all'|'latest'){
  setMsg('');setLoadingLabel(mode==='latest'?'Preparing latest quotations Excel...':'Preparing all quotations Excel...');setLoading(true);
  try{const source=mode==='latest'?latestForFiltered:filtered;const r=await fetch('/api/history/export',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({ids:source.map(x=>x.id)})});if(!r.ok)return setMsg(await r.text());const b=await r.blob(),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=mode==='latest'?'quotation-list-latest.xlsx':'quotation-list-all.xlsx';a.click();URL.revokeObjectURL(u)}finally{setLoading(false)}
 }
 async function deleteSelected(){if(!selectedQuotes.length)return;setDeleteConfirm(false);setMsg('');setLoadingLabel('Deleting selected quotations...');setLoading(true);try{const r=await fetch('/api/history/batch',{method:'DELETE',headers:{'content-type':'application/json'},body:JSON.stringify({ids:selectedQuotes.map(q=>q.id)})});const j=await r.json().catch(()=>({}));if(!r.ok)return setMsg(j.error||'Failed to delete selected quotations');setSelectedIds(new Set());setMsg(`${selectedQuotes.length} quotation(s) deleted. Running numbers remain reserved.`);await load()}finally{setLoading(false)}}
 async function printSelected(){if(!selectedQuotes.length)return;setMsg('');setLoadingLabel('Preparing selected quotations...');setLoading(true);try{const r=await fetch('/api/history/print',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({ids:selectedQuotes.map(q=>q.id)})});if(!r.ok)return setMsg(await r.text());const b=await r.blob(),u=URL.createObjectURL(b);const w=window.open(u,'_blank');if(w)w.opener=null;else{const a=document.createElement('a');a.href=u;a.download='selected-quotations.pdf';a.click()}setTimeout(()=>URL.revokeObjectURL(u),60000)}finally{setLoading(false)}}
 const clear=()=>{setSales([]);setClients([]);setSearch('');setAppliedSearch('');setPage(1)};
 const applySearch=()=>{setAppliedSearch(search);setPage(1)};
 const toggleSelected=(id:string)=>setSelectedIds(current=>{const next=new Set(current);if(next.has(id))next.delete(id);else next.add(id);return next});
 const togglePage=()=>setSelectedIds(current=>{const next=new Set(current);if(allPageSelected)pageIds.forEach(id=>next.delete(id));else pageIds.forEach(id=>next.add(id));return next});
 return <>
 <LoadingOverlay show={loading} label={loadingLabel}/>
 <header className="page-head"><div><h1>Quotation List</h1><p>Search, filter, reload, print, or delete quotation records.</p></div><div className="head-actions"><button className="btn ghost icon-btn" onClick={load}><UiIcon name="refresh"/>Refresh</button></div></header>{msg&&<div className="notice">{msg}</div>}
 <section className="summary-grid"><div><small>Clients</small><b>{summary.clients}</b></div><div><small>Quotes</small><b>{summary.quotes}</b></div><div><small>Amount</small><b>IDR {compactAmount(summary.amount)}</b></div></section>
 <section className="panel"><div className="list-tools aligned-list-tools"><div className="filters toolbar-row"><SearchPopover value={search} onChange={setSearch} onSearch={applySearch} onClear={()=>{setSearch('');setAppliedSearch('');setPage(1)}}/><MultiCheckFilter label="Sales PIC" values={salesOptions} selected={sales} onChange={v=>{setSales(v);setPage(1)}}/><MultiCheckFilter label="Client" values={clientOptions} selected={clients} onChange={v=>{setClients(v);setPage(1)}}/>{(sales.length||clients.length||appliedSearch)&&<button className="btn ghost toolbar-btn" onClick={clear}>Clear Filters</button>}<div className="list-toolbar-spacer"/><button className="selection-action-button selection-delete" title="Delete selected" aria-label="Delete selected quotations" disabled={!selectedQuotes.length} onClick={()=>setDeleteConfirm(true)}><UiIcon name="trash" size={20}/></button><button className="selection-action-button selection-print" title="Print selected" aria-label="Print selected quotations" disabled={!selectedQuotes.length} onClick={()=>void printSelected()}><UiIcon name="print" size={20}/></button><details className="download-choice"><summary className="btn excel icon-btn list-download"><UiIcon name="download"/>Download Excel</summary><div className="download-choice-menu"><button type="button" onClick={e=>{e.currentTarget.closest('details')?.removeAttribute('open');void download('all')}}>All Quotation</button><button type="button" onClick={e=>{e.currentTarget.closest('details')?.removeAttribute('open');void download('latest')}}>Latest Quotation Only</button></div></details></div></div>
 <div className="history-wrap quotation-sheet-wrap"><table className="history-table item-history quotation-sheet selection-history"><thead><tr><th className="select-col"><input type="checkbox" aria-label="Select quotations on this page" checked={allPageSelected} onChange={togglePage}/></th><th className="reload-col">Reload</th><th className="rowno">No</th><th className="latest-quo-col">Latest Quo</th><th>Quotation No.</th><th>Date</th><th>Client</th><th>Sales PIC</th><th className="rowno">Item No</th><th>Code</th><th>Item / Description</th><th>Specification</th><th>Brand</th><th>User</th><th>Lead Time</th><th>Qty</th><th>UOM</th><th>Unit Price</th><th>Amount</th><th>Remarks</th></tr></thead><tbody>{tableRows.length?tableRows.map(({quote,item,itemIndex,groupIndex,rowSpan})=>{const first=itemIndex===0;const k=baseKey(quote);const latest=latestByBase.get(k)?.id===quote.id;const revised=(groupCounts.get(k)||0)>1||revNo(quote)>0;return <tr key={`${quote.id}-${itemIndex}`} className={`${groupIndex%2?'quote-group-alt':'quote-group-base'} ${first?'quote-group-start':''}`}>
 {first&&<><td className="select-col merged-cell" rowSpan={rowSpan}><input type="checkbox" aria-label={`Select ${quote.quotation_no}`} checked={selectedIds.has(quote.id)} onChange={()=>toggleSelected(quote.id)}/></td><td className="reload-col merged-cell" rowSpan={rowSpan}><button className="icon-only-button reload-icon" title="Muat Ulang" aria-label={`Muat Ulang ${quote.quotation_no}`} onClick={()=>router.push(`/?reload=${quote.id}`)}><UiIcon name="refresh" size={16}/></button></td><td className="rowno merged-cell" rowSpan={rowSpan}>{(safePage-1)*pageSize+groupIndex+1}</td><td className="latest-quo-col merged-cell" rowSpan={rowSpan}>{latest&&revised?<span className="latest-quo-badge">Latest</span>:''}</td><td className="merged-cell" rowSpan={rowSpan}><b>{quote.quotation_no}</b></td><td className="merged-cell" rowSpan={rowSpan}>{quote.quotation_date}</td><td className="merged-cell" rowSpan={rowSpan}>{quote.client_name}</td><td className="merged-cell" rowSpan={rowSpan}>{quote.sales_name}</td></>}
 <td className="rowno">{itemIndex+1}</td><td>{item?.code||''}</td><td>{item?.productName||''}</td><td className="spec-cell">{item?.spec||''}</td><td>{item?.brand||''}</td><td>{item?.user||''}</td><td className="center-cell">{item?.leadTime?`${item.leadTime} ${item.leadTimeUnit||'Days'}`:''}</td><td className="num">{item?.qty?idr.format(item.qty):''}</td><td className="center-cell">{item?.uom||''}</td><td className="num">{item?`IDR ${idr.format(item.unitPrice||0)}`:''}</td><td className="num">{item?`IDR ${idr.format((item.qty||0)*(item.unitPrice||0))}`:''}</td><td className="history-remark readonly-remark">{item?.remarks||''}</td>
 </tr>}) :<tr><td colSpan={20} className="empty-table">No quotation matches the current filters.</td></tr>}</tbody></table></div>
 <PaginationBar page={safePage} pageSize={pageSize} total={filtered.length} onPageChange={setPage} onPageSizeChange={size=>{setPageSize(size);setPage(1)}}/>
 <ConfirmDialog open={deleteConfirm} detail={selectedQuotes.length?`${selectedQuotes.length} selected quotation(s) will be deleted. Quotation numbers will not be reused.`:undefined} onCancel={()=>setDeleteConfirm(false)} onYes={()=>void deleteSelected()}/>
 </section></>
}
