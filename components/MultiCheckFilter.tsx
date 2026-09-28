'use client';
import {useMemo,useRef,useState,useEffect} from 'react';

export default function MultiCheckFilter({label,values,selected,onChange}:{label:string;values:string[];selected:string[];onChange:(v:string[])=>void}){
 const[open,setOpen]=useState(false),[q,setQ]=useState(''),[draft,setDraft]=useState<string[]>(selected);
 const ref=useRef<HTMLDivElement>(null);
 const opts=useMemo(()=>values.filter(x=>x.toLowerCase().includes(q.toLowerCase())),[values,q]);
 const selectedSet=useMemo(()=>new Set(draft),[draft]);
 const allChecked=values.length>0&&values.every(v=>selectedSet.has(v));
 useEffect(()=>{if(!open)setDraft(selected)},[selected,open]);
 useEffect(()=>{const f=(e:MouseEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node)){setOpen(false);setDraft(selected);setQ('')}};document.addEventListener('mousedown',f);return()=>document.removeEventListener('mousedown',f)},[selected]);
 const toggle=(v:string)=>setDraft(current=>current.includes(v)?current.filter(x=>x!==v):[...current,v]);
 const openMenu=()=>{if(!open){setDraft(selected.length?selected:[...values]);setQ('')}setOpen(!open)};
 const apply=()=>{const normalized=draft.length===values.length?[]:draft;onChange(normalized);setOpen(false);setQ('')};
 const clearAll=()=>setDraft([]);
 const toggleAll=()=>setDraft(allChecked?[]:[...values]);
 return <div className="filter" ref={ref}>
  <button type="button" className={`filter-btn ${open?'open':''}`} onClick={openMenu}>{label}{selected.length?` (${selected.length})`:''} ▾</button>
  {open&&<div className="filter-pop staged-filter-pop">
   <input autoFocus placeholder={`Search ${label}...`} value={q} onChange={e=>setQ(e.target.value)}/>
   <div className="filter-list">
    <label className="select-all-row"><input type="checkbox" checked={allChecked} onChange={toggleAll}/><b>(Select All)</b></label>
    {opts.map(v=><label key={v}><input type="checkbox" checked={selectedSet.has(v)} onChange={()=>toggle(v)}/>{v}</label>)}
   </div>
   <div className="filter-pop-actions"><button type="button" className="btn primary" onClick={apply}>Apply</button><button type="button" className="btn ghost" onClick={clearAll}>Clear All</button></div>
  </div>}
 </div>
}
