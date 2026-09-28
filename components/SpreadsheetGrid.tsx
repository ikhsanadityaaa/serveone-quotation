'use client';
import {useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import type {ClipboardEvent,KeyboardEvent,PointerEvent as ReactPointerEvent,ChangeEvent} from 'react';
import type {QuoteItem,Uom} from '@/lib/types';
import {formatUomLabel} from '@/lib/uoms';

const cols:(keyof QuoteItem)[]=['code','productName','spec','brand','user','leadTime','qty','uom','unitPrice','remarks'];
const labels=['Code','Item / Description','Specification','Brand','User','Lead Time','Qty','UOM','Unit Price','Remarks'];
const USER_HISTORY_KEY='serveone-item-users-v1';
const idr=new Intl.NumberFormat('id-ID');
const digitsNumber=(v:string)=>Math.max(0,Number(String(v||'').replace(/\D/g,''))||0);
const digitsOnly=(v:string)=>String(v||'').replace(/\D/g,'');
const numericKeys=new Set<keyof QuoteItem>(['leadTime','qty','unitPrice']);
const numericWarning='Only numbers are allowed for Lead Time, Qty, and Unit Price.';
export const blankRow=():QuoteItem=>({code:'',productName:'',spec:'',brand:'',user:'',leadTime:'',leadTimeUnit:'Days',qty:0,uom:'EA',unitPrice:0,remarks:''});

type CellRange={r1:number;c1:number;r2:number;c2:number};
const normalizedRange=(range:CellRange)=>({rMin:Math.min(range.r1,range.r2),rMax:Math.max(range.r1,range.r2),cMin:Math.min(range.c1,range.c2),cMax:Math.max(range.c1,range.c2)});
const clipboardNumber=(value:string,key:keyof QuoteItem)=>{
 const raw=String(value??'').trim();
 if(!raw)return key==='leadTime'?'':0;
 if(!/^[\d\s.,]+$/.test(raw)||!/\d/.test(raw))return null;
 const digits=raw.replace(/\D/g,'');
 if(!digits)return null;
 return key==='leadTime'?digits:Math.max(0,Number(digits)||0);
};

function UomPicker({value,uoms,onChange,onFocus,onKeyDown,onPaste,cellId}:{value:string;uoms:Uom[];onChange:(v:string)=>void;onFocus:()=>void;onKeyDown:(e:KeyboardEvent<HTMLInputElement>)=>void;onPaste:(e:ClipboardEvent<HTMLInputElement>)=>void;cellId:string}){
 const [open,setOpen]=useState(false),[q,setQ]=useState('');
 const wrapRef=useRef<HTMLDivElement>(null),searchRef=useRef<HTMLInputElement>(null);
 const [pos,setPos]=useState({top:0,left:0,width:220});
 const selected=String(value||'EA').toUpperCase();
 const filtered=useMemo(()=>{const needle=q.trim().toLowerCase();if(!needle)return uoms;return uoms.filter(u=>`${u.code} ${u.name||''}`.toLowerCase().includes(needle))},[uoms,q]);
 const close=()=>{setOpen(false);setQ('')};
 const place=()=>{const el=wrapRef.current;if(!el||typeof window==='undefined')return;const r=el.getBoundingClientRect();const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');if(ctx)ctx.font='12px Arial';const widest=uoms.reduce((max,u)=>{const label=formatUomLabel(u);const measured=ctx?.measureText(label).width||label.length*7;return Math.max(max,measured)},0);const w=Math.min(420,Math.max(220,Math.ceil(widest+62)));setPos({top:r.bottom+4,left:Math.min(r.left,Math.max(8,window.innerWidth-w-8)),width:w})};
 const show=()=>{onFocus();setQ('');place();setOpen(true);requestAnimationFrame(()=>searchRef.current?.focus())};
 const choose=(code:string)=>{onChange(code.toUpperCase());close()};
 useEffect(()=>{if(!open)return;const outside=(e:MouseEvent)=>{const t=e.target as Node;if(wrapRef.current?.contains(t))return;const pop=document.querySelector('[data-uom-popover="true"]');if(pop?.contains(t))return;close()};const reposition=()=>place();const onScroll=(e:Event)=>{const t=e.target;const pop=document.querySelector('[data-uom-popover="true"]');if(t instanceof Node&&pop?.contains(t))return;place()};document.addEventListener('mousedown',outside);window.addEventListener('resize',reposition);window.addEventListener('scroll',onScroll,true);return()=>{document.removeEventListener('mousedown',outside);window.removeEventListener('resize',reposition);window.removeEventListener('scroll',onScroll,true)}},[open,uoms]);
 const searchKey=(e:KeyboardEvent<HTMLInputElement>)=>{if(e.key==='Enter'){e.preventDefault();const exact=uoms.find(u=>u.code.toLowerCase()===q.trim().toLowerCase());const first=exact||filtered[0];if(first)choose(first.code);return}if(e.key==='Escape'){e.preventDefault();close();return}if(e.key==='Tab'){close();onKeyDown(e)}};
 const mainKey=(e:KeyboardEvent<HTMLInputElement>)=>{if((e.key==='Enter'||e.key==='ArrowDown')&&!open){e.preventDefault();show();return}onKeyDown(e)};
 const popup=open&&typeof document!=='undefined'?createPortal(<div data-uom-popover="true" className="uom-dropdown-popover" style={{top:pos.top,left:pos.left,width:pos.width}} onWheel={e=>e.stopPropagation()} onMouseDown={e=>e.stopPropagation()}><div className="uom-dropdown-search"><input ref={searchRef} autoFocus value={q} onChange={e=>setQ(e.target.value)} onKeyDown={searchKey} placeholder="Search UOM..."/></div><div className="uom-dropdown-list">{filtered.map(u=><button type="button" key={u.id} className={u.code===selected?'selected':''} onMouseDown={e=>e.preventDefault()} onClick={()=>choose(u.code)}><span className="uom-code">{u.code}</span><span className="uom-name">{u.name?`(${String(u.name).toLowerCase().replace(/\b\w/g,m=>m.toUpperCase())})`:''}</span></button>)}{!filtered.length&&<div className="uom-dropdown-empty">No matching UOM</div>}</div></div>,document.body):null;
 return <div className="uom-picker" ref={wrapRef}><input className="uom-search-input uom-select-trigger" data-cell={cellId} value={selected} readOnly autoComplete="off" onFocus={()=>{if(!open)show();else onFocus()}} onClick={()=>{if(!open)show()}} onKeyDown={mainKey} onPaste={onPaste} title={formatUomLabel(uoms.find(u=>u.code===selected)||{code:selected,name:''})} aria-haspopup="listbox" aria-expanded={open}/>{popup}</div>
}

function autoGrow(el:HTMLTextAreaElement){
 el.style.height='35px';
 el.style.height=`${Math.max(35,el.scrollHeight)}px`;
}

export default function SpreadsheetGrid({rows,setRows,uoms}:{rows:QuoteItem[];setRows:(r:QuoteItem[])=>void;uoms:Uom[]}){
 const [active,setActive]=useState<[number,number]>([0,0]);
 const [fill,setFill]=useState<{r:number;c:number;toR:number;toC:number}|null>(null);
 const [selection,setSelection]=useState<CellRange|null>(null);
 const [rangeDragging,setRangeDragging]=useState(false);
 const [rowHeights,setRowHeights]=useState<number[]>([]);
 const [priceDraft,setPriceDraft]=useState<Record<number,string>>({});
 const [qtyDraft,setQtyDraft]=useState<Record<number,string>>({});
 const [userHistory,setUserHistory]=useState<string[]>(()=>{if(typeof window==='undefined')return[];try{return JSON.parse(localStorage.getItem(USER_HISTORY_KEY)||'[]')}catch{return[]}});
 const fillRef=useRef(fill);fillRef.current=fill;
 const selectionRef=useRef(selection);selectionRef.current=selection;
 const pointerRef=useRef<{r:number;c:number;x:number;y:number;dragging:boolean}|null>(null);
 const tableRef=useRef<HTMLTableElement>(null);
 useEffect(()=>{let live=true;(async()=>{try{const r=await fetch('/api/item-users',{cache:'no-store'});if(!r.ok)return;const j=await r.json();if(!live||!Array.isArray(j.users))return;setUserHistory(current=>{const merged=[...current,...j.users].map(String).map(x=>x.trim()).filter(Boolean);return [...new Map(merged.map(x=>[x.toLowerCase(),x])).values()].slice(0,100)})}catch{}})();return()=>{live=false}},[]);
 useLayoutEffect(()=>{const frame=requestAnimationFrame(()=>{const heights=rows.map((_,r)=>{const tr=tableRef.current?.querySelector<HTMLTableRowElement>(`tr[data-item-row="${r}"]`);if(!tr)return 36;let max=36;tr.querySelectorAll<HTMLTextAreaElement>('textarea.auto-wrap').forEach(el=>{autoGrow(el);max=Math.max(max,Math.ceil(el.scrollHeight)+1)});return max});setRowHeights(prev=>prev.length===heights.length&&prev.every((x,i)=>x===heights[i])?prev:heights)});return()=>cancelAnimationFrame(frame)},[rows]);
 const activateCell=(r:number,c:number)=>{setActive([r,c]);setSelection({r1:r,c1:c,r2:r,c2:c})};
 const patch=(r:number,c:number,v:string)=>{const next=rows.map(x=>({...x}));const key=cols[c];if(key==='qty'||key==='unitPrice')(next[r] as any)[key]=digitsNumber(v);else if(key==='leadTime')(next[r] as any)[key]=digitsOnly(v);else if(key==='uom')(next[r] as any)[key]=String(v||'EA').trim().toUpperCase();else (next[r] as any)[key]=v;setRows(next)};
 const patchLeadUnit=(r:number,v:'Days'|'Week')=>{const next=rows.map(x=>({...x}));next[r].leadTimeUnit=v;setRows(next)};
 const clearDraftRows=(rowIndexes:Set<number>)=>{setPriceDraft(current=>{const next={...current};rowIndexes.forEach(r=>delete next[r]);return next});setQtyDraft(current=>{const next={...current};rowIndexes.forEach(r=>delete next[r]);return next})};
 const onPaste=(e:ClipboardEvent,r:number,c:number)=>{
  const txt=e.clipboardData.getData('text/plain');
  const startKey=cols[c];
  const isMatrix=txt.includes('\t')||txt.includes('\n')||txt.includes('\r');
  if(!isMatrix){
   if(!numericKeys.has(startKey))return;
   e.preventDefault();
   const parsed=clipboardNumber(txt,startKey);
   if(parsed===null){window.alert(numericWarning);return}
   const next=rows.map(x=>({...x}));
   (next[r] as any)[startKey]=parsed;
   setRows(next);
   clearDraftRows(new Set([r]));
   return;
  }
  e.preventDefault();
  const matrix=txt.replace(/\r/g,'').split('\n').filter((x,i,a)=>x||i<a.length-1).map(x=>x.split('\t'));
  for(let ri=0;ri<matrix.length;ri++)for(let ci=0;ci<matrix[ri].length;ci++){
   const cc=c+ci;if(cc>=cols.length)continue;const key=cols[cc];if(!numericKeys.has(key))continue;
   if(clipboardNumber(matrix[ri][ci],key)===null){window.alert(numericWarning);return}
  }
  const next=rows.map(x=>({...x}));
  while(next.length<r+matrix.length)next.push(blankRow());
  const touched=new Set<number>();
  matrix.forEach((line,ri)=>line.forEach((v,ci)=>{const cc=c+ci;if(cc>=cols.length)return;const key=cols[cc];const rr=r+ri;touched.add(rr);if(numericKeys.has(key)){(next[rr] as any)[key]=clipboardNumber(v,key);return}if(key==='uom')(next[rr] as any)[key]=String(v||'EA').trim().toUpperCase();else (next[rr] as any)[key]=v}));
  setRows(next);clearDraftRows(touched);
 };
 const focusCell=(r:number,c:number)=>{activateCell(r,c);requestAnimationFrame(()=>document.querySelector<HTMLElement>(`[data-cell="${r}-${c}"]`)?.focus())};
 const keyNav=(e:KeyboardEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>,r:number,c:number)=>{if(e.key==='Tab'){e.preventDefault();const nc=e.shiftKey?c-1:c+1;if(nc<0&&r>0)focusCell(r-1,cols.length-1);else if(nc>=cols.length){if(r===rows.length-1)setRows([...rows,blankRow()]);focusCell(Math.min(r+1,rows.length),0)}else focusCell(r,nc)}};
 const startFill=(e:ReactPointerEvent,r:number,c:number)=>{e.preventDefault();e.stopPropagation();(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);setFill({r,c,toR:r,toC:c})};
 const moveFill=(e:ReactPointerEvent)=>{const current=fillRef.current;if(!current)return;const el=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-grid-cell]') as HTMLElement|null;if(!el)return;const rr=Number(el.dataset.r);if(Number.isFinite(rr))setFill(f=>f?{...f,toR:rr,toC:f.c}:f)};
 const endFill=()=>{const f=fillRef.current;if(!f)return;const next=rows.map(x=>({...x}));const key=cols[f.c];const source=(rows[f.r] as any)[key];const sourceUnit=rows[f.r].leadTimeUnit||'Days';for(let rr=Math.min(f.r,f.toR);rr<=Math.max(f.r,f.toR);rr++){if(rr===f.r)continue;(next[rr] as any)[key]=source;if(key==='leadTime')next[rr].leadTimeUnit=sourceUnit}setRows(next);setFill(null)};
 const beginRange=(e:ReactPointerEvent<HTMLTableCellElement>,r:number,c:number)=>{if(e.button!==0||(e.target as HTMLElement).closest('.fill-handle'))return;activateCell(r,c);pointerRef.current={r,c,x:e.clientX,y:e.clientY,dragging:false}};
 useEffect(()=>{
  const move=(e:PointerEvent)=>{const p=pointerRef.current;if(!p||fillRef.current)return;const distance=Math.hypot(e.clientX-p.x,e.clientY-p.y);if(!p.dragging&&distance<4)return;if(!p.dragging){p.dragging=true;setRangeDragging(true)}window.getSelection()?.removeAllRanges();const el=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-grid-cell]') as HTMLElement|null;if(!el)return;const rr=Number(el.dataset.r),cc=Number(el.dataset.c);if(Number.isFinite(rr)&&Number.isFinite(cc))setSelection({r1:p.r,c1:p.c,r2:rr,c2:cc})};
  const up=()=>{if(fillRef.current)endFill();pointerRef.current=null;setRangeDragging(false)};
  window.addEventListener('pointermove',move,{passive:true});window.addEventListener('pointerup',up);return()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up)}
 });
 const clearSelectedRange=(range:CellRange)=>{const {rMin,rMax,cMin,cMax}=normalizedRange(range);const next=rows.map(x=>({...x}));const touched=new Set<number>();for(let rr=rMin;rr<=rMax;rr++){if(!next[rr])continue;touched.add(rr);for(let cc=cMin;cc<=cMax;cc++){const key=cols[cc];if(!key)continue;if(key==='qty'||key==='unitPrice')(next[rr] as any)[key]=0;else if(key==='leadTime'){(next[rr] as any)[key]='';next[rr].leadTimeUnit='Days'}else if(key==='uom')(next[rr] as any)[key]='EA';else (next[rr] as any)[key]=''}}setRows(next);clearDraftRows(touched)};
 useEffect(()=>{const down=(e:globalThis.KeyboardEvent)=>{if(e.key!=='Delete'&&e.key!=='Backspace')return;const range=selectionRef.current;if(!range)return;const n=normalizedRange(range);const multi=n.rMin!==n.rMax||n.cMin!==n.cMax;if(!multi)return;const target=e.target as HTMLElement|null;if(!target?.closest('.sheet-wrap'))return;e.preventDefault();clearSelectedRange(range)};document.addEventListener('keydown',down);return()=>document.removeEventListener('keydown',down)});
 const inFill=(r:number,c:number)=>!!fill&&c===fill.c&&r>=Math.min(fill.r,fill.toR)&&r<=Math.max(fill.r,fill.toR);
 const inSelection=(r:number,c:number)=>{if(!selection)return false;const n=normalizedRange(selection);return r>=n.rMin&&r<=n.rMax&&c>=n.cMin&&c<=n.cMax};
 const amountInSelection=(r:number)=>{if(!selection)return false;const n=normalizedRange(selection);return r>=n.rMin&&r<=n.rMax&&n.cMin<=8&&n.cMax>=9};
 const rememberUser=(value:string)=>{const name=value.trim();if(!name)return;setUserHistory(current=>{const next=[name,...current.filter(x=>x.toLowerCase()!==name.toLowerCase())].slice(0,100);localStorage.setItem(USER_HISTORY_KEY,JSON.stringify(next));return next})};
 const textAreaCell=(row:QuoteItem,r:number,k:keyof QuoteItem,c:number)=>{const val=String(row[k]??'');return <textarea className={`auto-wrap ${k==='remarks'?'remarks-input':''}`} rows={1} data-cell={`${r}-${c}`} value={val} onFocus={e=>{activateCell(r,c);autoGrow(e.currentTarget)}} onKeyDown={e=>keyNav(e,r,c)} onPaste={e=>onPaste(e,r,c)} onChange={(e:ChangeEvent<HTMLTextAreaElement>)=>{patch(r,c,e.target.value);autoGrow(e.target)}}/>};
 const cell=(row:QuoteItem,r:number,k:keyof QuoteItem,c:number)=>{
  const activeCell=active[0]===r&&active[1]===c;
  return <td key={k} data-grid-cell data-r={r} data-c={c} className={`${activeCell?'cell-focus':''} ${inFill(r,c)?'fill-range':''} ${inSelection(r,c)?'range-selected':''} ${k==='remarks'?'remarks-cell':''}`} onPointerDown={e=>beginRange(e,r,c)} onPointerMove={moveFill}>
   {k==='leadTime'?<div className="lead-time-input"><input className="lead-time-value" data-cell={`${r}-${c}`} inputMode="numeric" pattern="[0-9]*" value={String(row.leadTime||'')} onFocus={()=>activateCell(r,c)} onKeyDown={e=>{if(e.key.length===1&&!/\d/.test(e.key)){e.preventDefault();return}keyNav(e,r,c)}} onPaste={e=>onPaste(e,r,c)} onChange={e=>patch(r,c,e.target.value)}/><select className="lead-time-unit" aria-label={`Lead time unit row ${r+1}`} value={row.leadTimeUnit||'Days'} onFocus={()=>activateCell(r,c)} onChange={e=>patchLeadUnit(r,e.target.value as 'Days'|'Week')}><option value="Days">Days</option><option value="Week">Week</option></select></div>
   :k==='uom'?<UomPicker cellId={`${r}-${c}`} value={String(row[k]||'EA')} uoms={uoms} onChange={v=>patch(r,c,v)} onFocus={()=>activateCell(r,c)} onKeyDown={e=>keyNav(e,r,c)} onPaste={e=>onPaste(e,r,c)}/>
   :k==='unitPrice'?<div className="currency-input"><span>IDR</span><input data-cell={`${r}-${c}`} inputMode="numeric" value={priceDraft[r]!==undefined?priceDraft[r]:(row.unitPrice?idr.format(row.unitPrice):'')} onFocus={()=>{activateCell(r,c);setPriceDraft(d=>({...d,[r]:row.unitPrice?String(row.unitPrice):''}))}} onBlur={e=>{patch(r,c,e.target.value);setPriceDraft(d=>{const next={...d};delete next[r];return next})}} onKeyDown={e=>keyNav(e,r,c)} onPaste={e=>onPaste(e,r,c)} onChange={e=>setPriceDraft(d=>({...d,[r]:e.target.value.replace(/\D/g,'')}))}/></div>
   :k==='qty'?<input className="qty-input" data-cell={`${r}-${c}`} inputMode="numeric" pattern="[0-9]*" value={qtyDraft[r]!==undefined?qtyDraft[r]:(row.qty?idr.format(row.qty):'')} onFocus={()=>{activateCell(r,c);setQtyDraft(d=>({...d,[r]:row.qty?String(row.qty):''}))}} onBlur={e=>{patch(r,c,e.target.value);setQtyDraft(d=>{const next={...d};delete next[r];return next})}} onKeyDown={e=>{if(e.key.length===1&&!/\d/.test(e.key)){e.preventDefault();return}keyNav(e,r,c)}} onPaste={e=>onPaste(e,r,c)} onChange={e=>setQtyDraft(d=>({...d,[r]:e.target.value.replace(/\D/g,'')}))}/>
   :k==='productName'||k==='spec'||k==='remarks'?textAreaCell(row,r,k,c)
   :<input data-cell={`${r}-${c}`} list={k==='user'?'item-user-history':undefined} autoComplete="off" value={String(row[k]??'')} type="text" onFocus={()=>activateCell(r,c)} onBlur={e=>{if(k==='user')rememberUser(e.target.value)}} onKeyDown={e=>keyNav(e,r,c)} onPaste={e=>onPaste(e,r,c)} onChange={e=>patch(r,c,e.target.value)}/>} 
   {activeCell&&<span className="fill-handle" title="Drag down to copy" onPointerDown={e=>startFill(e,r,c)} onPointerMove={moveFill}/>} 
  </td>
 };
 return <div className="sheet-wrap"><datalist id="item-user-history">{userHistory.map(x=><option key={x} value={x}/>)}</datalist><div className="sheet-canvas"><table ref={tableRef} className={`sheet ${rangeDragging?'range-selecting':''}`}><colgroup><col className="col-no"/><col className="col-code"/><col className="col-item"/><col className="col-spec"/><col className="col-brand"/><col className="col-user"/><col className="col-lead"/><col className="col-qty"/><col className="col-uom"/><col className="col-price"/><col className="col-amount"/><col className="col-remarks"/></colgroup><thead><tr><th className="rowno">No</th>{labels.slice(0,-1).map(x=><th key={x}>{x}</th>)}<th>Amount</th><th>Remarks</th></tr></thead><tbody>{rows.map((row,r)=><tr key={r} data-item-row={r} style={{height:rowHeights[r]?`${rowHeights[r]}px`:undefined}}><td className="rowno">{r+1}</td>{cols.slice(0,-1).map((k,c)=>cell(row,r,k,c))}<td className={`amount-cell ${amountInSelection(r)?'range-selected':''}`}><div className="amount-inner"><span>IDR</span><b>{idr.format((row.qty||0)*(row.unitPrice||0))}</b></div></td>{cell(row,r,'remarks',cols.length-1)}</tr>)}</tbody></table></div><div className="sheet-hint">Paste directly from Excel. Lead Time, Qty, and Unit Price accept numbers only. Drag across cells to select a range, then press Delete/Backspace to clear it. Drag the blue handle downward to repeat a value, including Lead Time and UOM.</div></div>
}
