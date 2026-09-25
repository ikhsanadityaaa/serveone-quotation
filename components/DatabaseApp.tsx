'use client';
import {useEffect,useMemo,useState} from 'react';
import type {Dispatch,SetStateAction} from 'react';
import type {Director,MemberRecord,SalesPerson,Uom} from '@/lib/types';
import UiIcon from './UiIcon';

type EntityKind='sales'|'uoms'|'directors';
const newId=()=>`new-${crypto.randomUUID()}`;

export default function DatabaseApp(){
 const [members,setMembers]=useState<MemberRecord[]>([]),[sales,setSales]=useState<SalesPerson[]>([]),[uoms,setUoms]=useState<Uom[]>([]),[directors,setDirectors]=useState<Director[]>([]);
 const [search,setSearch]=useState(''),[msg,setMsg]=useState(''),[busy,setBusy]=useState(false);
 const [memberAddCount,setMemberAddCount]=useState(5),[salesAddCount,setSalesAddCount]=useState(1),[uomAddCount,setUomAddCount]=useState(1),[signAddCount,setSignAddCount]=useState(1);
 const [dirtyMembers,setDirtyMembers]=useState<Set<string>>(new Set()),[dirtySales,setDirtySales]=useState<Set<string>>(new Set()),[dirtyUoms,setDirtyUoms]=useState<Set<string>>(new Set()),[dirtyDirectors,setDirtyDirectors]=useState<Set<string>>(new Set());

 async function load(){
  setBusy(true);
  try{
   const r=await fetch('/api/masters',{cache:'no-store'}),j=await r.json();
   if(!r.ok)throw new Error(j.error||'Failed to load database');
   setMembers(j.members||[]);setSales(j.sales||[]);setUoms(j.uoms||[]);setDirectors(j.directors||[]);
   setDirtyMembers(new Set());setDirtySales(new Set());setDirtyUoms(new Set());setDirtyDirectors(new Set());
  }catch(e){setMsg(e instanceof Error?e.message:'Failed to load database')}finally{setBusy(false)}
 }
 useEffect(()=>{void load()},[]);

 const shown=useMemo(()=>{const q=search.trim().toLowerCase();if(!q)return members;return members.filter(x=>[x.op_unit_name,x.member_name,x.client_name,x.address,x.client_code].join(' ').toLowerCase().includes(q))},[members,search]);
 const clamp=(n:number)=>Math.min(100,Math.max(1,Math.floor(Number(n)||1)));
 function mark(setter:Dispatch<SetStateAction<Set<string>>>,id:string){setter(old=>{const next=new Set(old);next.add(id);return next})}
 function patchMember(id:string,key:keyof MemberRecord,v:unknown){setMembers(old=>old.map(x=>x.id===id?{...x,[key]:v}:x));mark(setDirtyMembers,id)}
 function patchEntity(kind:EntityKind,id:string,key:string,v:unknown){
  if(kind==='sales'){setSales(old=>old.map(x=>x.id===id?{...x,[key]:v}:x));mark(setDirtySales,id)}
  if(kind==='uoms'){setUoms(old=>old.map(x=>x.id===id?{...x,[key]:v}:x));mark(setDirtyUoms,id)}
  if(kind==='directors'){setDirectors(old=>old.map(x=>x.id===id?{...x,[key]:v}:x));mark(setDirtyDirectors,id)}
 }
 function addMembers(){const count=clamp(memberAddCount);const rows=Array.from({length:count},()=>({id:newId(),member_name:'',op_unit_name:'',client_name:'',address:'',client_code:'',active:true} as MemberRecord));setMembers(old=>[...rows,...old]);setDirtyMembers(old=>{const n=new Set(old);rows.forEach(x=>n.add(x.id));return n})}
 function addEntities(kind:EntityKind,countRaw:number){const count=clamp(countRaw);if(kind==='sales'){const rows=Array.from({length:count},()=>({id:newId(),name:'',email:'',phone:'',active:true} as SalesPerson));setSales(old=>[...rows,...old]);setDirtySales(old=>{const n=new Set(old);rows.forEach(x=>n.add(x.id));return n})}
  if(kind==='uoms'){const rows=Array.from({length:count},()=>({id:newId(),code:'',name:'',active:true} as Uom));setUoms(old=>[...rows,...old]);setDirtyUoms(old=>{const n=new Set(old);rows.forEach(x=>n.add(x.id));return n})}
  if(kind==='directors'){const rows=Array.from({length:count},()=>({id:newId(),name:'',title:'President Director',active:true} as Director));setDirectors(old=>[...rows,...old]);setDirtyDirectors(old=>{const n=new Set(old);rows.forEach(x=>n.add(x.id));return n})}}

 async function saveMemberRow(row:MemberRecord){const isNew=row.id.startsWith('new-');const r=await fetch('/api/members',{method:isNew?'POST':'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({row:{...row,id:isNew?undefined:row.id}})});const j=await r.json();if(!r.ok)throw new Error(j.error||'Member save failed')}
 async function saveEntityRow(entity:EntityKind,row:SalesPerson|Uom|Director){const isNew=String(row.id).startsWith('new-');const r=await fetch('/api/database',{method:isNew?'POST':'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({entity,row:{...row,id:isNew?undefined:row.id}})});const j=await r.json();if(!r.ok)throw new Error(j.error||'Save failed')}
 async function saveMembers(){const rows=members.filter(x=>dirtyMembers.has(x.id));if(!rows.length)return setMsg('No member changes to save.');setBusy(true);try{for(const row of rows){if(!row.op_unit_name.trim()&&!row.member_name.trim()&&!row.client_name.trim()&&!row.client_code.trim())continue;await saveMemberRow(row)}setMsg(`Saved ${rows.length} member change(s).`);await load()}catch(e){setMsg(e instanceof Error?e.message:'Save failed')}finally{setBusy(false)}}
 async function saveEntities(kind:EntityKind){const source=kind==='sales'?sales:kind==='uoms'?uoms:directors;const dirty=kind==='sales'?dirtySales:kind==='uoms'?dirtyUoms:dirtyDirectors;const rows=source.filter(x=>dirty.has(x.id));if(!rows.length)return setMsg('No changes to save.');setBusy(true);try{for(const row of rows){const key=kind==='uoms'?(row as Uom).code:(row as SalesPerson|Director).name;if(!String(key||'').trim())continue;await saveEntityRow(kind,row)}setMsg(`Saved ${rows.length} ${kind==='sales'?'Sales PIC':kind==='uoms'?'UOM':'signatory'} change(s).`);await load()}catch(e){setMsg(e instanceof Error?e.message:'Save failed')}finally{setBusy(false)}}
 async function removeMember(row:MemberRecord){if(row.id.startsWith('new-')){setMembers(old=>old.filter(x=>x.id!==row.id));setDirtyMembers(old=>{const n=new Set(old);n.delete(row.id);return n});return}if(!confirm('Delete this database row?'))return;const r=await fetch('/api/members',{method:'DELETE',headers:{'content-type':'application/json'},body:JSON.stringify({id:row.id})});if(!r.ok)return setMsg('Delete failed');await load()}
 async function removeEntity(kind:EntityKind,id:string){if(id.startsWith('new-')){if(kind==='sales')setSales(x=>x.filter(v=>v.id!==id));if(kind==='uoms')setUoms(x=>x.filter(v=>v.id!==id));if(kind==='directors')setDirectors(x=>x.filter(v=>v.id!==id));return}if(!confirm('Delete this row?'))return;const r=await fetch('/api/database',{method:'DELETE',headers:{'content-type':'application/json'},body:JSON.stringify({entity:kind,id})});if(!r.ok)return setMsg('Delete failed');await load()}

 return <>
  <header className="page-head"><div><h1>Database</h1><p>Input directly in the tables, then save changes to Supabase. No Excel upload is required.</p></div></header>
  {msg&&<div className="notice">{msg}</div>}

  <section className="panel db-section">
   <div className="panel-title"><div><h2>Member Database</h2><p>Client, Attention, Client Nm., Address, and unique Client Code used by Create Quotation.</p></div><div className="table-actions"><div className="add-many"><input aria-label="Member rows to add" type="number" min="1" max="100" value={memberAddCount} onChange={e=>setMemberAddCount(clamp(Number(e.target.value)))}/><button type="button" className="btn ghost" onClick={addMembers}>+ Add Rows</button></div><button className="btn primary icon-btn" disabled={busy} onClick={saveMembers}><UiIcon name="document"/>Save Changes</button></div></div>
   <div className="member-search"><UiIcon name="search"/><input aria-label="Search database" placeholder="Search database" value={search} onChange={e=>setSearch(e.target.value)}/></div>
   <div className="history-wrap"><table className="db-table member-table editable-grid"><thead><tr><th>Client</th><th>Attention</th><th>Client Nm.</th><th>Address</th><th>Code</th><th>Active</th><th></th></tr></thead><tbody>{shown.slice(0,1500).map(row=><tr key={row.id} className={dirtyMembers.has(row.id)?'dirty-row':''}><td><input value={row.op_unit_name||''} onChange={e=>patchMember(row.id,'op_unit_name',e.target.value)}/></td><td><input value={row.member_name||''} onChange={e=>patchMember(row.id,'member_name',e.target.value)}/></td><td><input value={row.client_name||''} onChange={e=>patchMember(row.id,'client_name',e.target.value)}/></td><td><input value={row.address||''} onChange={e=>patchMember(row.id,'address',e.target.value)}/></td><td><input className="code-input" value={row.client_code||''} onChange={e=>patchMember(row.id,'client_code',e.target.value.toUpperCase())}/></td><td><input type="checkbox" checked={row.active!==false} onChange={e=>patchMember(row.id,'active',e.target.checked)}/></td><td><button type="button" className="row-delete" aria-label="Delete member row" onClick={()=>removeMember(row)}>×</button></td></tr>)}{!shown.length&&<tr><td colSpan={7} className="empty-table">No rows. Add rows above, fill the table, then Save Changes.</td></tr>}</tbody></table></div>
   {shown.length>1500&&<div className="table-note">Showing first 1,500 matching rows.</div>}
  </section>

  <div className="database-grid">
   <section className="panel db-section"><div className="panel-title"><div><h2>Sales PIC</h2><p>Used in the Sales PIC dropdown.</p></div><div className="table-actions"><div className="add-many"><input aria-label="Sales rows to add" type="number" min="1" max="50" value={salesAddCount} onChange={e=>setSalesAddCount(clamp(Number(e.target.value)))}/><button className="btn ghost" onClick={()=>addEntities('sales',salesAddCount)}>+ Add Rows</button></div><button className="btn primary" disabled={busy} onClick={()=>saveEntities('sales')}>Save</button></div></div><div className="history-wrap"><table className="db-table compact-db"><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Active</th><th></th></tr></thead><tbody>{sales.map(row=><tr key={row.id} className={dirtySales.has(row.id)?'dirty-row':''}><td><input value={row.name||''} onChange={e=>patchEntity('sales',row.id,'name',e.target.value)}/></td><td><input value={row.email||''} onChange={e=>patchEntity('sales',row.id,'email',e.target.value)}/></td><td><input value={row.phone||''} onChange={e=>patchEntity('sales',row.id,'phone',e.target.value)}/></td><td><input type="checkbox" checked={row.active!==false} onChange={e=>patchEntity('sales',row.id,'active',e.target.checked)}/></td><td><button className="row-delete" onClick={()=>removeEntity('sales',row.id)}>×</button></td></tr>)}</tbody></table></div></section>

   <section className="panel db-section"><div className="panel-title"><div><h2>UOM</h2><p>Used in the Items UOM dropdown.</p></div><div className="table-actions"><div className="add-many"><input aria-label="UOM rows to add" type="number" min="1" max="50" value={uomAddCount} onChange={e=>setUomAddCount(clamp(Number(e.target.value)))}/><button className="btn ghost" onClick={()=>addEntities('uoms',uomAddCount)}>+ Add Rows</button></div><button className="btn primary" disabled={busy} onClick={()=>saveEntities('uoms')}>Save</button></div></div><div className="history-wrap"><table className="db-table compact-db"><thead><tr><th>Code</th><th>Name</th><th>Active</th><th></th></tr></thead><tbody>{uoms.map(row=><tr key={row.id} className={dirtyUoms.has(row.id)?'dirty-row':''}><td><input value={row.code||''} onChange={e=>patchEntity('uoms',row.id,'code',e.target.value.toUpperCase())}/></td><td><input value={row.name||''} onChange={e=>patchEntity('uoms',row.id,'name',e.target.value)}/></td><td><input type="checkbox" checked={row.active!==false} onChange={e=>patchEntity('uoms',row.id,'active',e.target.checked)}/></td><td><button className="row-delete" onClick={()=>removeEntity('uoms',row.id)}>×</button></td></tr>)}</tbody></table></div></section>
  </div>

  <section className="panel db-section signatory-section"><div className="panel-title"><div><h2>President Director</h2><p>Name/title can be edited here. The signature image is stored in GitHub as <code>public/signature-mr-herry.png</code>, so no browser upload is needed.</p></div><div className="table-actions"><div className="add-many"><input aria-label="Signatory rows to add" type="number" min="1" max="10" value={signAddCount} onChange={e=>setSignAddCount(clamp(Number(e.target.value)))}/><button className="btn ghost" onClick={()=>addEntities('directors',signAddCount)}>+ Add Rows</button></div><button className="btn primary" disabled={busy} onClick={()=>saveEntities('directors')}>Save</button></div></div><div className="signatory-layout"><div className="history-wrap"><table className="db-table compact-db"><thead><tr><th>Name</th><th>Title</th><th>Active</th><th></th></tr></thead><tbody>{directors.map(row=><tr key={row.id} className={dirtyDirectors.has(row.id)?'dirty-row':''}><td><input value={row.name||''} onChange={e=>patchEntity('directors',row.id,'name',e.target.value)}/></td><td><input value={row.title||''} onChange={e=>patchEntity('directors',row.id,'title',e.target.value)}/></td><td><input type="checkbox" checked={row.active!==false} onChange={e=>patchEntity('directors',row.id,'active',e.target.checked)}/></td><td><button className="row-delete" onClick={()=>removeEntity('directors',row.id)}>×</button></td></tr>)}</tbody></table></div><div className="signature-preview"><span>Embedded signature</span><img src="/signature-mr-herry.png" alt="President Director signature"/></div></div></section>
 </>
}
