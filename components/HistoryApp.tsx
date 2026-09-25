'use client';
import {useEffect,useMemo,useState} from 'react';
import {useRouter} from 'next/navigation';
import MultiCheckFilter from './MultiCheckFilter';
import UiIcon from './UiIcon';
import PaginationBar from './PaginationBar';
import type {QuoteItem,StoredQuotation} from '@/lib/types';

const idr=new Intl.NumberFormat('id-ID');
type HistoryItemRow={quote:StoredQuotation;item:QuoteItem|null;itemIndex:number;groupIndex:number};

export default function HistoryApp(){
 const router=useRouter();
 const [rows,setRows]=useState<StoredQuotation[]>([]),[search,setSearch]=useState(''),[appliedSearch,setAppliedSearch]=useState(''),[sales,setSales]=useState<string[]>([]),[clients,setClients]=useState<string[]>([]),[loading,setLoading]=useState(true),[msg,setMsg]=useState('');
 const [page,setPage]=useState(1),[pageSize,setPageSize]=useState(25);
 async function load(){setLoading(true);const r=await fetch('/api/history',{cache:'no-store'}),j=await r.json();if(r.ok)setRows(j);else setMsg(j.error||'Failed to load');setLoading(false)}
 useEffect(()=>{void load()},[]);
 const searchTerms=useMemo(()=>appliedSearch.split(/\r?\n/).map(x=>x.trim().toLowerCase()).filter(Boolean),[appliedSearch]);
 const passSearch=(r:StoredQuotation)=>{if(!searchTerms.length)return true;const blob=[r.quotation_no,r.quotation_date,r.client_name,r.content?.clientNm,r.client_code,r.sales_name,r.total_amount,r.content?.attention,r.content?.address,r.content?.rfqNo,...(r.content?.items||[]).flatMap(i=>[i.code,i.productName,i.spec,i.brand,i.user,i.leadTime,i.qty,i.uom,i.unitPrice,(i.qty||0)*(i.unitPrice||0),i.remarks]),...(r.content?.notes||[])].join(' ').toLowerCase();return searchTerms.some(t=>blob.includes(t))};
 const baseForSales=useMemo(()=>rows.filter(r=>passSearch(r)&&(clients.length===0||clients.includes(r.client_name))),[rows,searchTerms.join('|'),clients.join('|')]);
 const baseForClients=useMemo(()=>rows.filter(r=>passSearch(r)&&(sales.length===0||sales.includes(r.sales_name))),[rows,searchTerms.join('|'),sales.join('|')]);
 const salesOptions=useMemo(()=>[...new Set(baseForSales.map(r=>r.sales_name).filter(Boolean))].sort(),[baseForSales]);
 const clientOptions=useMemo(()=>[...new Set(baseForClients.map(r=>r.client_name).filter(Boolean))].sort(),[baseForClients]);
 const filtered=useMemo(()=>rows.filter(r=>passSearch(r)&&(sales.length===0||sales.includes(r.sales_name))&&(clients.length===0||clients.includes(r.client_name))),[rows,searchTerms.join('|'),sales.join('|'),clients.join('|')]);
 const summary=useMemo(()=>({quotes:filtered.length,amount:filtered.reduce((s,r)=>s+Number(r.total_amount||0),0),clients:new Set(filtered.map(r=>r.client_name).filter(Boolean)).size}),[filtered]);
 const totalPages=Math.max(1,Math.ceil(filtered.length/pageSize));
 const safePage=Math.min(page,totalPages);
 const pageQuotes=useMemo(()=>filtered.slice((safePage-1)*pageSize,safePage*pageSize),[filtered,safePage,pageSize]);
 const tableRows=useMemo(()=>pageQuotes.flatMap<HistoryItemRow>((quote,groupIndex)=>quote.content?.items?.length?quote.content.items.map((item,itemIndex)=>({quote,item,itemIndex,groupIndex})):[{quote,item:null,itemIndex:-1,groupIndex}]),[pageQuotes]);
 useEffect(()=>{if(page>totalPages)setPage(totalPages)},[page,totalPages]);
 async function download(){setMsg('');const r=await fetch('/api/history/export',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({ids:filtered.map(x=>x.id)})});if(!r.ok)return setMsg(await r.text());const b=await r.blob(),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='quotation-list.xlsx';a.click();URL.revokeObjectURL(u)}
 function editRemark(id:string,itemIndex:number,remarks:string){setRows(current=>current.map(q=>q.id!==id?q:{...q,content:{...q.content,items:q.content.items.map((item,i)=>i===itemIndex?{...item,remarks}:item)}}))}
 async function saveRemark(id:string,itemIndex:number,remarks:string){const r=await fetch(`/api/quotation/${id}`,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({itemIndex,remarks})});if(!r.ok)setMsg((await r.json()).error||'Failed to update remarks')}
 const clear=()=>{setSales([]);setClients([]);setSearch('');setAppliedSearch('');setPage(1)};
 const applySearch=()=>{setAppliedSearch(search);setPage(1)};
 const changeSales=(v:string[])=>{setSales(v);setPage(1)};
 const changeClients=(v:string[])=>{setClients(v);setPage(1)};
 return <>
 <header className="page-head"><div><h1>Quotation List</h1><p>Search, filter, download, or reload a quotation.</p></div><div className="head-actions"><button className="btn ghost icon-btn" onClick={load}><UiIcon name="refresh"/>Refresh</button></div></header>{msg&&<div className="notice">{msg}</div>}
 <section className="summary-grid"><div><small>Clients</small><b>{summary.clients}</b></div><div><small>Quotes</small><b>{summary.quotes}</b></div><div><small>Amount</small><b>IDR {idr.format(summary.amount)}</b></div></section>
 <section className="panel"><div className="list-tools"><div className="search-inline advanced-search"><div className="search-box"><UiIcon name="search" size={16}/><textarea rows={1} aria-label="Search" placeholder="Search" value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&e.ctrlKey){e.preventDefault();applySearch()}}}/>{search.split(/\r?\n/).filter(x=>x.trim()).length>1&&<span className="term-count">{search.split(/\r?\n/).filter(x=>x.trim()).length}</span>}</div><button className="btn primary icon-btn" onClick={applySearch}><UiIcon name="search"/>Search</button><small className="search-help">Multiple values: separate each value with Enter.</small></div><div className="filters"><MultiCheckFilter label="Sales PIC" values={salesOptions} selected={sales} onChange={changeSales}/><MultiCheckFilter label="Client" values={clientOptions} selected={clients} onChange={changeClients}/>{(sales.length||clients.length||appliedSearch)&&<button className="btn ghost" onClick={clear}>Clear</button>}</div></div>
 <div className="history-wrap quotation-sheet-wrap"><table className="history-table item-history quotation-sheet"><thead><tr><th>Quotation No.</th><th>Date</th><th>Client</th><th>Sales PIC</th><th className="rowno">No</th><th>Code</th><th>Item / Description</th><th>Specification</th><th>Brand</th><th>User</th><th>Lead Time</th><th className="num">Qty</th><th>UOM</th><th className="num">Unit Price</th><th className="num">Amount</th><th>Remarks</th><th className="reload-col">Action</th></tr></thead><tbody>{loading?<tr><td colSpan={17}>Loading...</td></tr>:tableRows.length?tableRows.map(({quote,item,itemIndex,groupIndex},rowIndex)=>{const first=rowIndex===0||tableRows[rowIndex-1].quote.id!==quote.id;return <tr key={`${quote.id}-${itemIndex}`} className={`${groupIndex%2?'quote-group-alt':'quote-group-base'} ${first?'quote-group-start':''}`}><td>{first?<b>{quote.quotation_no}</b>:''}</td><td>{first?quote.quotation_date:''}</td><td>{first?quote.client_name:''}</td><td>{first?quote.sales_name:''}</td><td className="rowno">{itemIndex>=0?itemIndex+1:''}</td><td>{item?.code||''}</td><td>{item?.productName||''}</td><td>{item?.spec||''}</td><td>{item?.brand||''}</td><td>{item?.user||''}</td><td>{item?.leadTime||''}</td><td className="num">{item?.qty||''}</td><td>{item?.uom||''}</td><td className="num">{item?`IDR ${idr.format(item.unitPrice||0)}`:''}</td><td className="num">{item?`IDR ${idr.format((item.qty||0)*(item.unitPrice||0))}`:''}</td><td className="history-remark">{item?<input aria-label={`Remarks ${quote.quotation_no} item ${itemIndex+1}`} value={item.remarks||''} onChange={e=>editRemark(quote.id,itemIndex,e.target.value)} onBlur={e=>void saveRemark(quote.id,itemIndex,e.target.value)}/>:null}</td><td className="reload-col">{first?<button className="btn primary small" onClick={()=>router.push(`/?reload=${quote.id}`)}>Muat Ulang</button>:null}</td></tr>}) :<tr><td colSpan={17} className="empty-table">No quotation matches the current filters.</td></tr>}</tbody></table></div>
 <PaginationBar page={safePage} pageSize={pageSize} total={filtered.length} onPageChange={setPage} onPageSizeChange={size=>{setPageSize(size);setPage(1)}}/>
 <div className="download-section"><div><b>Download quotation list</b><small>{filtered.length} filtered quotation{filtered.length===1?'':'s'} will be exported.</small></div><button className="btn excel icon-btn" onClick={download}><UiIcon name="download"/>Download Excel</button></div></section></>
}
