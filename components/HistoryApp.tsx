'use client';
import {useEffect,useMemo,useState} from 'react';
import {useRouter} from 'next/navigation';
import MultiCheckFilter from './MultiCheckFilter';
import UiIcon from './UiIcon';
import PaginationBar from './PaginationBar';
import SearchPopover from './SearchPopover';
import LoadingOverlay from './LoadingOverlay';
import type {QuoteItem,StoredQuotation} from '@/lib/types';

const idr=new Intl.NumberFormat('id-ID');
type HistoryItemRow={quote:StoredQuotation;item:QuoteItem|null;itemIndex:number;groupIndex:number;rowSpan:number};

export default function HistoryApp(){
 const router=useRouter();
 const [rows,setRows]=useState<StoredQuotation[]>([]),[search,setSearch]=useState(''),[appliedSearch,setAppliedSearch]=useState(''),[sales,setSales]=useState<string[]>([]),[clients,setClients]=useState<string[]>([]),[loading,setLoading]=useState(true),[msg,setMsg]=useState('');
 const [page,setPage]=useState(1),[pageSize,setPageSize]=useState(25);
 async function load(){setLoading(true);try{const r=await fetch('/api/history',{cache:'no-store'}),j=await r.json();if(r.ok)setRows(j);else setMsg(j.error||'Failed to load')}finally{setLoading(false)}}
 useEffect(()=>{void load()},[]);
 const searchTerms=useMemo(()=>appliedSearch.split(/\r?\n/).map(x=>x.trim().toLowerCase()).filter(Boolean),[appliedSearch]);
 const passSearch=(r:StoredQuotation)=>{if(!searchTerms.length)return true;const blob=[r.quotation_no,r.quotation_date,r.client_name,r.sales_name,r.total_amount,r.content?.attention,r.content?.address,r.content?.rfqNo,...(r.content?.items||[]).flatMap(i=>[i.productName,i.spec,i.brand,i.user,i.leadTime,i.qty,i.uom,i.unitPrice,(i.qty||0)*(i.unitPrice||0),i.remarks]),...(r.content?.notes||[])].join(' ').toLowerCase();return searchTerms.some(t=>blob.includes(t))};
 const baseForSales=useMemo(()=>rows.filter(r=>passSearch(r)&&(clients.length===0||clients.includes(r.client_name))),[rows,searchTerms.join('|'),clients.join('|')]);
 const baseForClients=useMemo(()=>rows.filter(r=>passSearch(r)&&(sales.length===0||sales.includes(r.sales_name))),[rows,searchTerms.join('|'),sales.join('|')]);
 const salesOptions=useMemo(()=>[...new Set(baseForSales.map(r=>String(r.sales_name||'')).filter(Boolean))].sort((a,b)=>a.localeCompare(b,undefined,{sensitivity:'base'})),[baseForSales]);
 const clientOptions=useMemo(()=>[...new Set(baseForClients.map(r=>String(r.client_name||'')).filter(Boolean))].sort((a,b)=>a.localeCompare(b,undefined,{sensitivity:'base'})),[baseForClients]);
 const filtered=useMemo(()=>rows.filter(r=>passSearch(r)&&(sales.length===0||sales.includes(r.sales_name))&&(clients.length===0||clients.includes(r.client_name))),[rows,searchTerms.join('|'),sales.join('|'),clients.join('|')]);
 const summary=useMemo(()=>({quotes:filtered.length,amount:filtered.reduce((sum,r)=>sum+(r.content?.items||[]).reduce((s,item)=>s+(Number(item.qty)||0)*(Number(item.unitPrice)||0),0),0),clients:new Set(filtered.map(r=>r.client_name).filter(Boolean)).size}),[filtered]);
 const totalPages=Math.max(1,Math.ceil(filtered.length/pageSize)),safePage=Math.min(page,totalPages),pageQuotes=filtered.slice((safePage-1)*pageSize,safePage*pageSize);
 const tableRows=useMemo(()=>pageQuotes.flatMap<HistoryItemRow>((quote,groupIndex)=>{const items=quote.content?.items?.length?quote.content.items:[null];return items.map((item,itemIndex)=>({quote,item,itemIndex,groupIndex,rowSpan:items.length}))}),[pageQuotes]);
 useEffect(()=>{if(page>totalPages)setPage(totalPages)},[page,totalPages]);
 async function download(){setMsg('');setLoading(true);try{const r=await fetch('/api/history/export',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({ids:filtered.map(x=>x.id)})});if(!r.ok)return setMsg(await r.text());const b=await r.blob(),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='quotation-list.xlsx';a.click();URL.revokeObjectURL(u)}finally{setLoading(false)}}
 async function deleteQuotation(id:string,quotationNo:string){if(!confirm(`Delete quotation ${quotationNo}?\n\nThis removes it from Quotation List only. The quotation running number will NOT be reused.`))return;setMsg('');setLoading(true);try{const r=await fetch(`/api/quotation/${id}`,{method:'DELETE'});const j=await r.json().catch(()=>({}));if(!r.ok)return setMsg(j.error||'Failed to delete quotation');setRows(current=>current.filter(q=>q.id!==id));setMsg(`${quotationNo} deleted. Its running number remains reserved.`)}finally{setLoading(false)}}
 const clear=()=>{setSales([]);setClients([]);setSearch('');setAppliedSearch('');setPage(1)};
 const applySearch=()=>{setAppliedSearch(search);setPage(1)};
 return <>
 <LoadingOverlay show={loading} label="Loading Quotation List..."/>
 <header className="page-head"><div><h1>Quotation List</h1><p>Search, filter, download, or reload a quotation.</p></div><div className="head-actions"><button className="btn ghost icon-btn" onClick={load}><UiIcon name="refresh"/>Refresh</button></div></header>{msg&&<div className="notice">{msg}</div>}
 <section className="summary-grid"><div><small>Clients</small><b>{summary.clients}</b></div><div><small>Quotes</small><b>{summary.quotes}</b></div><div><small>Amount</small><b>IDR {idr.format(summary.amount)}</b></div></section>
 <section className="panel"><div className="list-tools aligned-list-tools"><div className="filters toolbar-row"><SearchPopover value={search} onChange={setSearch} onSearch={applySearch} onClear={()=>{setSearch('');setAppliedSearch('');setPage(1)}}/><MultiCheckFilter label="Sales PIC" values={salesOptions} selected={sales} onChange={v=>{setSales(v);setPage(1)}}/><MultiCheckFilter label="Client" values={clientOptions} selected={clients} onChange={v=>{setClients(v);setPage(1)}}/>{(sales.length||clients.length||appliedSearch)&&<button className="btn ghost toolbar-btn" onClick={clear}>Clear</button>}<button className="btn excel icon-btn list-download" onClick={download}><UiIcon name="download"/>Download Excel</button></div></div>
 <div className="history-wrap quotation-sheet-wrap"><table className="history-table item-history quotation-sheet"><thead><tr><th className="rowno">No</th><th>Quotation No.</th><th>Date</th><th>Client</th><th>Sales PIC</th><th className="rowno">Item No</th><th>Item / Description</th><th>Specification</th><th>Brand</th><th>User</th><th>Lead Time (Days)</th><th>Qty</th><th>UOM</th><th>Unit Price</th><th>Amount</th><th>Remarks</th><th className="reload-col">Action</th></tr></thead><tbody>{tableRows.length?tableRows.map(({quote,item,itemIndex,groupIndex,rowSpan})=>{const first=itemIndex===0;return <tr key={`${quote.id}-${itemIndex}`} className={`${groupIndex%2?'quote-group-alt':'quote-group-base'} ${first?'quote-group-start':''}`}>
 {first&&<><td className="rowno merged-cell" rowSpan={rowSpan}>{(safePage-1)*pageSize+groupIndex+1}</td><td className="merged-cell" rowSpan={rowSpan}><b>{quote.quotation_no}</b></td><td className="merged-cell" rowSpan={rowSpan}>{quote.quotation_date}</td><td className="merged-cell" rowSpan={rowSpan}>{quote.client_name}</td><td className="merged-cell" rowSpan={rowSpan}>{quote.sales_name}</td></>}
 <td className="rowno">{itemIndex>=0?itemIndex+1:''}</td><td>{item?.productName||''}</td><td>{item?.spec||''}</td><td>{item?.brand||''}</td><td>{item?.user||''}</td><td className="center-cell">{item?.leadTime||''}</td><td className="num">{item?.qty||''}</td><td className="center-cell">{item?.uom||''}</td><td className="num">{item?`IDR ${idr.format(item.unitPrice||0)}`:''}</td><td className="num">{item?`IDR ${idr.format((item.qty||0)*(item.unitPrice||0))}`:''}</td><td className="history-remark readonly-remark">{item?.remarks||''}</td>
 {first&&<td className="reload-col merged-cell" rowSpan={rowSpan}><div className="history-actions"><button className="icon-only-button reload-icon" title="Muat Ulang" aria-label={`Muat Ulang ${quote.quotation_no}`} onClick={()=>router.push(`/?reload=${quote.id}`)}><UiIcon name="refresh" size={16}/></button><button className="x-button" title={`Delete ${quote.quotation_no}`} aria-label={`Delete ${quote.quotation_no}`} onClick={()=>void deleteQuotation(quote.id,quote.quotation_no)}><UiIcon name="remove" size={15}/></button></div></td>}
 </tr>}) :<tr><td colSpan={17} className="empty-table">No quotation matches the current filters.</td></tr>}</tbody></table></div>
 <PaginationBar page={safePage} pageSize={pageSize} total={filtered.length} onPageChange={setPage} onPageSizeChange={size=>{setPageSize(size);setPage(1)}}/>
 </section></>
}
