'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
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

function PinIcon(){
 return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 3h6l-1 5 3 3v1H7v-1l3-3-1-5Z"/><path d="M12 12v9"/></svg>;
}

export default function HistoryApp(){
 const router=useRouter();
 const [rows,setRows]=useState<StoredQuotation[]>([]),[search,setSearch]=useState(''),[appliedSearch,setAppliedSearch]=useState(''),[sales,setSales]=useState<string[]>([]),[clients,setClients]=useState<string[]>([]),[loading,setLoading]=useState(true),[loadingLabel,setLoadingLabel]=useState('Loading Quotation History...'),[msg,setMsg]=useState('');
 const [page,setPage]=useState(1),[pageSize,setPageSize]=useState(15),[selectedIds,setSelectedIds]=useState<Set<string>>(new Set());
 const [deleteConfirm,setDeleteConfirm]=useState(false);
 const [pinnedColumn,setPinnedColumn]=useState<string|null>(null);
 const historyWrapRef=useRef<HTMLDivElement>(null),floatingScrollRef=useRef<HTMLDivElement>(null);
 const [floatingUi,setFloatingUi]=useState({barVisible:false,headerVisible:false,left:0,width:0,scrollLeft:0,tableWidth:0,headerWidths:[] as number[]});
 async function load(){setLoadingLabel('Loading Quotation History...');setLoading(true);try{const r=await fetch('/api/history',{cache:'no-store'}),j=await r.json();if(r.ok)setRows(j);else setMsg(j.error||'Failed to load')}finally{setLoading(false)}}
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

 useEffect(()=>{
  const wrap=historyWrapRef.current;if(!wrap)return;
  const table=wrap.querySelector('table');const thead=table?.querySelector('thead');
  let frame=0;
  const update=()=>{
   cancelAnimationFrame(frame);
   frame=requestAnimationFrame(()=>{
    const rect=wrap.getBoundingClientRect();
    const tableRect=table?.getBoundingClientRect();
    const headRect=thead?.getBoundingClientRect();
    const left=Math.max(0,rect.left),right=Math.min(window.innerWidth,rect.right),width=Math.max(0,right-left);
    const tableWidth=wrap.scrollWidth;
    const barVisible=tableWidth>wrap.clientWidth+1&&rect.top<window.innerHeight&&rect.bottom>0&&width>0;
    const headerHeight=headRect?.height||0;
    const headerVisible=Boolean(headRect&&tableRect&&headRect.top<0&&tableRect.bottom>headerHeight&&width>0);
    const headerWidths=thead?[...thead.querySelectorAll('th')].map(cell=>cell.getBoundingClientRect().width):[];
    setFloatingUi({barVisible,headerVisible,left,width,scrollLeft:wrap.scrollLeft,tableWidth,headerWidths});
    if(floatingScrollRef.current&&Math.abs(floatingScrollRef.current.scrollLeft-wrap.scrollLeft)>1)floatingScrollRef.current.scrollLeft=wrap.scrollLeft;
   });
  };
  update();
  const ro=typeof ResizeObserver!=='undefined'?new ResizeObserver(update):null;ro?.observe(wrap);if(table)ro?.observe(table);
  wrap.addEventListener('scroll',update,{passive:true});window.addEventListener('scroll',update,{passive:true});window.addEventListener('resize',update);
  return()=>{cancelAnimationFrame(frame);ro?.disconnect();wrap.removeEventListener('scroll',update);window.removeEventListener('scroll',update);window.removeEventListener('resize',update)};
 },[tableRows.length,pageSize,safePage]);
 const syncFloatingScroll=()=>{if(historyWrapRef.current&&floatingScrollRef.current&&Math.abs(historyWrapRef.current.scrollLeft-floatingScrollRef.current.scrollLeft)>1)historyWrapRef.current.scrollLeft=floatingScrollRef.current.scrollLeft};
 async function download(mode:'all'|'latest'){
  setMsg('');setLoadingLabel(mode==='latest'?'Preparing latest quotations Excel...':'Preparing all quotations Excel...');setLoading(true);
  try{const source=mode==='latest'?latestForFiltered:filtered;const r=await fetch('/api/history/export',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({ids:source.map(x=>x.id)})});if(!r.ok)return setMsg(await r.text());const b=await r.blob(),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=mode==='latest'?'quotation-list-latest.xlsx':'quotation-list-all.xlsx';a.click();URL.revokeObjectURL(u)}finally{setLoading(false)}
 }
 async function deleteSelected(){if(!selectedQuotes.length)return;setDeleteConfirm(false);setMsg('');setLoadingLabel('Deleting selected quotations...');setLoading(true);try{const r=await fetch('/api/history/batch',{method:'DELETE',headers:{'content-type':'application/json'},body:JSON.stringify({ids:selectedQuotes.map(q=>q.id)})});const j=await r.json().catch(()=>({}));if(!r.ok)return setMsg(j.error||'Failed to delete selected quotations');setSelectedIds(new Set());setMsg(`${selectedQuotes.length} quotation(s) deleted. Running numbers remain reserved.`);await load()}finally{setLoading(false)}}
 function printSelected(){
  if(!selectedQuotes.length)return;
  setMsg('');
  // Submit directly to the PDF endpoint so Chrome receives Content-Disposition
  // and keeps the quotation number as the document filename instead of a blob UUID.
  const form=document.createElement('form');
  form.method='POST';
  form.action='/api/history/print';
  form.target='_blank';
  form.style.display='none';
  const input=document.createElement('input');
  input.type='hidden';
  input.name='ids';
  input.value=JSON.stringify(selectedQuotes.map(q=>q.id));
  form.appendChild(input);
  document.body.appendChild(form);
  form.submit();
  form.remove();
 }
 const clear=()=>{setSales([]);setClients([]);setSearch('');setAppliedSearch('');setPage(1)};
 const applySearch=()=>{setAppliedSearch(search);setPage(1)};
 const toggleSelected=(id:string)=>setSelectedIds(current=>{const next=new Set(current);if(next.has(id))next.delete(id);else next.add(id);return next});
 const togglePage=()=>setSelectedIds(current=>{const next=new Set(current);if(allPageSelected)pageIds.forEach(id=>next.delete(id));else pageIds.forEach(id=>next.add(id));return next});
 const historyHeaders=[
  {key:'select',className:'select-col',content:<input type="checkbox" aria-label="Select quotations on this page" checked={allPageSelected} onChange={togglePage}/>,pinnable:false},
  {key:'reload',className:'reload-col',content:'Reload',pinnable:false},
  {key:'no',className:'rowno',content:'No'},
  {key:'latest',className:'latest-quo-col',content:'Latest Quo'},
  {key:'quotation',content:'Quotation No.'},{key:'date',content:'Date'},{key:'client',content:'Client'},{key:'sales',content:'Sales PIC'},
  {key:'itemno',className:'rowno',content:'Item No'},{key:'code',content:'Code'},{key:'item',content:'Item / Description'},{key:'spec',content:'Specification'},
  {key:'brand',content:'Brand'},{key:'user',content:'User'},{key:'lead',content:'Lead Time'},{key:'qty',className:'qty-head',content:'Qty'},{key:'uom',content:'UOM'},
  {key:'unitprice',content:'Unit Price'},{key:'amount',content:'Amount'},{key:'totalamount',content:'Total Amount'},{key:'remarks',content:'Remarks'}
 ];
 const cellClass=(key:string,base='')=>[base,pinnedColumn===key?'history-pinned-cell':''].filter(Boolean).join(' ');
 const headerContent=(h:(typeof historyHeaders)[number])=>{
  const active=pinnedColumn===h.key;
  return <div className="history-header-inner"><span className="history-header-label">{h.content}</span>{h.pinnable!==false&&<button type="button" className={`history-pin-button ${active?'active':''}`} title={active?'Unpin column':'Pin column'} aria-label={`${active?'Unpin':'Pin'} ${typeof h.content==='string'?h.content:h.key} column`} aria-pressed={active} onClick={e=>{e.stopPropagation();setPinnedColumn(active?null:h.key)}}><PinIcon/></button>}</div>;
 };
 const headerClass=(h:(typeof historyHeaders)[number])=>cellClass(h.key,h.className||'');
 return <>
 <LoadingOverlay show={loading} label={loadingLabel}/>
 <header className="page-head"><div><h1>Quotation History</h1><p>Search, filter, reload, print, or delete quotation records.</p></div><div className="head-actions"><button className="btn ghost icon-btn" onClick={load}><UiIcon name="refresh"/>Refresh</button></div></header>{msg&&<div className="notice">{msg}</div>}
 <section className="summary-grid"><div><small>Clients</small><b>{summary.clients}</b></div><div><small>Quotes</small><b>{summary.quotes}</b></div><div><small>Amount</small><b>IDR {compactAmount(summary.amount)}</b></div></section>
 <section className="panel"><div className="list-tools aligned-list-tools"><div className="filters toolbar-row"><SearchPopover value={search} onChange={setSearch} onSearch={applySearch} onClear={()=>{setSearch('');setAppliedSearch('');setPage(1)}}/><MultiCheckFilter label="Sales PIC" values={salesOptions} selected={sales} onChange={v=>{setSales(v);setPage(1)}}/><MultiCheckFilter label="Client" values={clientOptions} selected={clients} onChange={v=>{setClients(v);setPage(1)}}/>{(sales.length||clients.length||appliedSearch)&&<button className="btn ghost toolbar-btn" onClick={clear}>Clear Filters</button>}<div className="list-toolbar-spacer"/><button className="selection-action-button selection-delete" title="Delete selected" aria-label="Delete selected quotations" disabled={!selectedQuotes.length} onClick={()=>setDeleteConfirm(true)}><UiIcon name="trash" size={20}/></button><button className="selection-action-button selection-print" title="Print selected" aria-label="Print selected quotations" disabled={!selectedQuotes.length} onClick={()=>void printSelected()}><UiIcon name="print" size={20}/></button><details className="download-choice"><summary className="btn excel icon-btn list-download"><UiIcon name="download"/>Download Excel</summary><div className="download-choice-menu"><button type="button" onClick={e=>{e.currentTarget.closest('details')?.removeAttribute('open');void download('all')}}>All Quotation</button><button type="button" onClick={e=>{e.currentTarget.closest('details')?.removeAttribute('open');void download('latest')}}>Latest Quotation Only</button></div></details></div></div>
 <div className="quotation-scroll-shell"><div ref={historyWrapRef} className="history-wrap quotation-sheet-wrap"><table className="history-table item-history quotation-sheet selection-history"><thead><tr>{historyHeaders.map(h=><th key={h.key} data-history-col={h.key} className={headerClass(h)}>{headerContent(h)}</th>)}</tr></thead><tbody>{tableRows.length?tableRows.map(({quote,item,itemIndex,groupIndex,rowSpan})=>{const first=itemIndex===0;const k=baseKey(quote);const latest=latestByBase.get(k)?.id===quote.id;const revised=(groupCounts.get(k)||0)>1||revNo(quote)>0;return <tr key={`${quote.id}-${itemIndex}`} className={`${groupIndex%2?'quote-group-alt':'quote-group-base'} ${first?'quote-group-start':''}`}>
 {first&&<><td data-history-col="select" className="select-col merged-cell" rowSpan={rowSpan}><input type="checkbox" aria-label={`Select ${quote.quotation_no}`} checked={selectedIds.has(quote.id)} onChange={()=>toggleSelected(quote.id)}/></td><td data-history-col="reload" className="reload-col merged-cell" rowSpan={rowSpan}><button className="icon-only-button reload-icon" title="Muat Ulang" aria-label={`Muat Ulang ${quote.quotation_no}`} onClick={()=>router.push(`/?reload=${quote.id}`)}><UiIcon name="refresh" size={16}/></button></td><td data-history-col="no" className={cellClass('no','rowno merged-cell')} rowSpan={rowSpan}>{(safePage-1)*pageSize+groupIndex+1}</td><td data-history-col="latest" className={cellClass('latest','latest-quo-col merged-cell')} rowSpan={rowSpan}>{latest&&revised?<span className="latest-quo-badge">Latest</span>:''}</td><td data-history-col="quotation" className={cellClass('quotation','merged-cell')} rowSpan={rowSpan}><b>{quote.quotation_no}</b></td><td data-history-col="date" className={cellClass('date','merged-cell')} rowSpan={rowSpan}>{quote.quotation_date}</td><td data-history-col="client" className={cellClass('client','merged-cell')} rowSpan={rowSpan}>{quote.client_name}</td><td data-history-col="sales" className={cellClass('sales','merged-cell')} rowSpan={rowSpan}>{quote.sales_name}</td></>}
 <td data-history-col="itemno" className={cellClass('itemno','rowno')}>{itemIndex+1}</td><td data-history-col="code" className={cellClass('code','code-cell')}>{String(item?.code||'').trim()}</td><td data-history-col="item" className={cellClass('item','item-desc-cell')}>{String(item?.productName||'').trim()}</td><td data-history-col="spec" className={cellClass('spec','spec-cell')}>{String(item?.spec||'').trim()}</td><td data-history-col="brand" className={cellClass('brand','brand-cell')}>{String(item?.brand||'').trim()}</td><td data-history-col="user" className={cellClass('user')}>{String(item?.user||'').trim()}</td><td data-history-col="lead" className={cellClass('lead','center-cell')}>{item?.leadTime?`${item.leadTime} ${item.leadTimeUnit||'Days'}`:''}</td><td data-history-col="qty" className={cellClass('qty','qty-cell')}>{item?.qty?idr.format(item.qty):''}</td><td data-history-col="uom" className={cellClass('uom','center-cell')}>{String(item?.uom||'').trim()}</td><td data-history-col="unitprice" className={cellClass('unitprice','unit-price-value currency-history-cell')}>{item?<div className="history-currency"><span>IDR</span><b>{idr.format(item.unitPrice||0)}</b></div>:''}</td><td data-history-col="amount" className={cellClass('amount','amount-value currency-history-cell')}>{item?<div className="history-currency"><span>IDR</span><b>{idr.format((item.qty||0)*(item.unitPrice||0))}</b></div>:''}</td>{first&&<td data-history-col="totalamount" className={cellClass('totalamount','merged-cell currency-history-cell total-amount-cell')} rowSpan={rowSpan}><div className="history-currency"><span>IDR</span><b>{idr.format((quote.content?.items||[]).reduce((sum,current)=>sum+(Number(current.qty)||0)*(Number(current.unitPrice)||0),0))}</b></div></td>}<td data-history-col="remarks" className={cellClass('remarks','history-remark readonly-remark')}>{String(item?.remarks||'').trim()}</td>
 </tr>}) :<tr><td colSpan={21} className="empty-table">No quotation matches the current filters.</td></tr>}</tbody></table></div></div>
 {floatingUi.headerVisible&&<div className="quotation-floating-header" style={{left:floatingUi.left,width:floatingUi.width}}><table className="history-table item-history quotation-sheet selection-history quotation-floating-header-table" style={{width:floatingUi.tableWidth,transform:`translateX(${-floatingUi.scrollLeft}px)`}}><thead><tr>{historyHeaders.map((h,i)=>{const w=floatingUi.headerWidths[i];const colLeft=floatingUi.headerWidths.slice(0,i).reduce((sum,n)=>sum+n,0);const pinShift=pinnedColumn===h.key?Math.max(0,floatingUi.scrollLeft-colLeft):0;return <th key={h.key} data-history-col={h.key} className={headerClass(h)} style={w?{width:w,minWidth:w,maxWidth:w,transform:pinShift?`translateX(${pinShift}px)`:undefined}:undefined}>{headerContent(h)}</th>})}</tr></thead></table></div>}
 {floatingUi.barVisible&&<div ref={floatingScrollRef} className="quotation-floating-scroll" style={{left:floatingUi.left,width:floatingUi.width}} onScroll={syncFloatingScroll} aria-label="Horizontal quotation table scrollbar"><div style={{width:floatingUi.tableWidth||1,height:1}}/></div>}
 <PaginationBar page={safePage} pageSize={pageSize} total={filtered.length} onPageChange={setPage} onPageSizeChange={size=>{setPageSize(size);setPage(1)}}/>
 <ConfirmDialog open={deleteConfirm} detail={selectedQuotes.length?`${selectedQuotes.length} selected quotation(s) will be deleted. Quotation numbers will not be reused.`:undefined} onCancel={()=>setDeleteConfirm(false)} onYes={()=>void deleteSelected()}/>
 </section></>
}
