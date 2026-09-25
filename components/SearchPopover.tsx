'use client';
import {useEffect,useRef,useState} from 'react';
import UiIcon from './UiIcon';

export default function SearchPopover({value,onChange,onSearch,onClear}:{value:string;onChange:(v:string)=>void;onSearch:()=>void;onClear:()=>void}){
 const [open,setOpen]=useState(false);const ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{const fn=(e:MouseEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node))setOpen(false)};document.addEventListener('mousedown',fn);return()=>document.removeEventListener('mousedown',fn)},[]);
 const count=value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).length;
 return <div className="search-popover" ref={ref}>
  <button type="button" className={`toolbar-btn ${open?'open':''}`} onClick={()=>setOpen(v=>!v)}><UiIcon name="search" size={17}/><span>Search</span>{count>0&&<em>{count}</em>}<span className="chev">⌄</span></button>
  {open&&<div className="search-pop-panel">
   <label>Search values (one per line):</label>
   <textarea autoFocus rows={5} placeholder={'SMI/KCC/2026-09/0001\nBearing\nPT KCC GLASS'} value={value} onChange={e=>onChange(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();onSearch();setOpen(false)}}}/>
   <div className="search-pop-actions"><button className="btn primary" onClick={()=>{onSearch();setOpen(false)}}>Search</button><button className="btn ghost" onClick={()=>{onClear();setOpen(false)}}>Clear</button></div>
  </div>}
 </div>
}
