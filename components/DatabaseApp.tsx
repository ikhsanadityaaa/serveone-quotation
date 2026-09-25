'use client';
import {useEffect,useMemo,useState} from 'react';
import type {Dispatch,SetStateAction} from 'react';
import type {Director,MemberRecord,SalesPerson} from '@/lib/types';
import UiIcon from './UiIcon';
import PaginationBar from './PaginationBar';

type EntityKind='sales'|'directors';
const newId=()=>`new-${crypto.randomUUID()}`;
const clamp=(n:number,max=100)=>Math.min(max,Math.max(1,Math.floor(Number(n)||1)));

export default function DatabaseApp(){
 const [members,setMembers]=useState<MemberRecord[]>([]),[sales,setSales]=useState<SalesPerson[]>([]),[directors,setDirectors]=useState<Director[]>([]);
 const [search,setSearch]=useState(''),[msg,setMsg]=useState(''),[busy,setBusy]=useState(false);
 const [memberAddCount,setMemberAddCount]=useState(5),[salesAddCount,setSalesAddCount]=useState(1),[signAddCount,setSignAddCount]=useState(1);
 const [memberPage,setMemberPage]=useState(1),[memberPageSize,setMemberPageSize]=useState(25);
 const [dirtyMembers,setDirtyMembers]=useState<Set<string>>(new Set()),[dirtySales,setDirtySales]=useState<Set<string>>(new Set()),[dirtyDirectors,setDirtyDirectors]=useState<Set<string>>(new Set());

 async function load(){
  setBusy(true);
  try{
   const r=await fetch('/api/masters',{cache:'no-store'}),j=await r.json();
   if(!r.ok)throw new Error(j.error||'Failed to load database');
   setMembers(j.members||[]);setSales(j.sales||[]);setDirectors(j.directors||[]);
   setDirtyMembers(new Set());setDirtySales(new Set());setDirtyDirectors(new Set());
  }catch(e){setMsg(e instanceof Error?e.message:'Failed to load database')}finally{setBusy(false)}
 }
 useEffect(()=>{void load()},[]);

 const shown=useMemo(()=>{const q=search.trim().toLowerCase();if(!q)return members;return members.filter(x=>[x.op_unit_name,x.member_name,x.client_name,x.address,x.client_code].join(' ').toLowerCase().includes(q))},[members,search]);
 const maxPage=Math.max(1,Math.ceil(shown.length/memberPageSize));
 const safePage=Math.min(memberPage,maxPage);
 const pagedMembers=useMemo(()=>shown.slice((safePage-1)*memberPageSize,safePage*memberPageSize),[shown,safePage,memberPageSize]);
 useEffect(()=>{if(memberPage>maxPage)setMemberPage(maxPage)},[memberPage,maxPage]);
 function mark(setter:Dispatch<SetStateAction<Set<string>>>,id:string){setter(old=>{const next=new Set(old);next.add(id);return next})}
 function patchMember(id:string,key:keyof MemberRecord,v:unknown){setMembers(old=>old.map(x=>x.id===id?{...x,[key]:v}:x));mark(setDirtyMembers,id)}
 function patchEntity(kind:EntityKind,id:string,key:string,v:unknown){
  if(kind==='sales'){setSales(old=>old.map(x=>x.id===id?{...x,[key]:v}:x));mark(setDirtySales,id)}
  if(kind==='directors'){setDirectors(old=>old.map(x=>x.id===id?{...x,[key]:v}:x));mark(setDirtyDirectors,id)}
 }
 function addMembers(){const count=clamp(memberAddCount,500);const rows=Array.from({length:count},()=>({id:newId(),member_name:'',op_unit_name:'',client_name:'',address:'',client_code:'',active:true} as MemberRecord));setMembers(old=>[...rows,...old]);setDirtyMembers(old=>{const n=new Set(old);rows.forEach(x=>n.add(x.id));return n});setSearch('');setMemberPage(1)}
 function addEntities(kind:EntityKind,countRaw:number){const count=clamp(countRaw,50);if(kind==='sales'){const rows=Array.from({length:count},()=>({id:newId(),name:'',email:'',phone:'',active:true} as SalesPerson));setSales(old=>[...rows,...old]);setDirtySales(old=>{const n=new Set(old);rows.forEach(x=>n.add(x.id));return n})}if(kind==='directors'){const rows=Array.from({length:count},()=>({id:newId(),name:'',title:'President Director',active:true} as Director));setDirectors(old=>[...rows,...old]);setDirtyDirectors(old=>{const n=new Set(old);rows.forEach(x=>n.add(x.id));return n})}}

 async function saveMemberRow(row:MemberRecord){const isNew=row.id.startsWith('new-');const r=await fetch('/api/members',{method:isNew?'POST':'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({row:{...row,id:isNew?undefined:row.id}})});const j=await r.json();if(!r.ok)throw new Error(j.error||'Member save failed')}
 async function saveEntityRow(entity:EntityKind,row:SalesPerson|Director){const isNew=String(row.id).startsWith('new-');const r=await fetch('/api/database',{method:isNew?'POST':'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({entity,row:{...row,id:isNew?undefined:row.id}})});const j=await r.json();if(!r.ok)throw new Error(j.error||'Save failed')}
 async function saveMembers(){const rows=members.filter(x=>dirtyMembers.has(x.id));if(!rows.length)return setMsg('No member changes to save.');setBusy(true);try{let saved=0;for(const row of rows){if(!row.op_unit_name.trim()&&!row.member_name.trim()&&!row.client_name.trim()&&!row.client_code.trim())continue;await saveMemberRow(row);saved++}setMsg(`Saved ${saved} member change(s).`);await load()}catch(e){setMsg(e instanceof Error?e.message:'Save failed')}finally{setBusy(false)}}
 async function saveEntities(kind:EntityKind){const source=kind==='sales'?sales:directors;const dirty=kind==='sales'?dirtySales:dirtyDirectors;const rows=source.filter(x=>dirty.has(x.id));if(!rows.length)return setMsg('No changes to save.');setBusy(true);try{let saved=0;for(const row of rows){if(!String(row.name||'').trim())continue;await saveEntityRow(kind,row);saved++}setMsg(`Saved ${saved} ${kind==='sales'?'Sales PIC':'signatory'} change(s).`);await load()}catch(e){setMsg(e instanceof Error?e.message:'Save failed')}finally{setBusy(false)}}
 async function removeMember(row:MemberRecord){if(row.id.startsWith('new-')){setMembers(old=>old.filter(x=>x.id!==row.id));setDirtyMembers(old=>{const n=new Set(old);n.delete(row.id);return n});return}if(!confirm('Delete this database row?'))return;const r=await fetch('/api/members',{method:'DELETE',headers:{'content-type':'application/json'},body:JSON.stringify({id:row.id})});if(!r.ok)return setMsg('Delete failed');await load()}
 async function removeEntity(kind:EntityKind,id:string){if(id.startsWith('new-')){if(kind==='sales')setSales(x=>x.filter(v=>v.id!==id));if(kind==='directors')setDirectors(x=>x.filter(v=>v.id!==id));return}if(!confirm('Delete this row?'))return;const r=await fetch('/api/database',{method:'DELETE',headers:{'content-type':'application/json'},body:JSON.stringify({entity:kind,id})});if(!r.ok)return setMsg('Delete failed');await load()}

 return <>
  <header className="page-head"><div><h1>Database</h1><p>Input directly in the tables, then save changes to Supabase. UOM is fixed from the company standard list.</p></div></header>
  {msg&&<div className="notice">{msg}</div>}

  <section className="panel db-section">
   <div className="panel-title"><div><h2>Member Database</h2><p>Client, Attention, Client Nm., Address, and unique Client Code used by Create Quotation.</p></div><div className="table-actions"><div className="add-many"><input aria-label="Member rows to add" type="number" min="1" max="500" value={memberAddCount} onChange={e=>setMemberAddCount(clamp(Number(e.target.value),500))}/><button type="button" className="btn ghost" onClick={addMembers}>+ Add Rows</button></div><button className="btn primary icon-btn" disabled={busy} onClick={saveMembers}><UiIcon name="document"/>Save Changes</button></div></div>
   <div className="member-search"><UiIcon name="search"/><input aria-label="Search database" placeholder="Search database" value={search} onChange={e=>{setSearch(e.target.value);setMemberPage(1)}}/></div>
   <div className="history-wrap"><table className="db-table member-table editable-grid zebra-grid"><thead><tr><th>Client</th><th>Attention</th><th>Client Nm.</th><th>Address</th><th>Code</th><th>Active</th><th></th></tr></thead><tbody>{pagedMembers.map(row=><tr key={row.id}><td><input value={row.op_unit_name||''} onChange={e=>patchMember(row.id,'op_unit_name',e.target.value)}/></td><td><input value={row.member_name||''} onChange={e=>patchMember(row.id,'member_name',e.target.value)}/></td><td><input value={row.client_name||''} onChange={e=>patchMember(row.id,'client_name',e.target.value)}/></td><td><input value={row.address||''} onChange={e=>patchMember(row.id,'address',e.target.value)}/></td><td><input className="code-input" value={row.client_code||''} onChange={e=>patchMember(row.id,'client_code',e.target.value.toUpperCase())}/></td><td><input type="checkbox" checked={row.active!==false} onChange={e=>patchMember(row.id,'active',e.target.checked)}/></td><td><button type="button" className="row-delete" title="Delete row" aria-label="Delete member row" onClick={()=>removeMember(row)}><UiIcon name="remove" size={16}/></button></td></tr>)}{!shown.length&&<tr><td colSpan={7} className="empty-table">No rows. Add rows above, fill the table, then Save Changes.</td></tr>}</tbody></table></div>
   <PaginationBar page={safePage} pageSize={memberPageSize} total={shown.length} onPageChange={setMemberPage} onPageSizeChange={size=>{setMemberPageSize(size);setMemberPage(1)}}/>
  </section>

  <div className="database-grid database-grid-no-uom">
   <section className="panel db-section"><div className="panel-title"><div><h2>Sales PIC</h2><p>Used in the Sales PIC dropdown. Up to 10 rows are visible; scroll for more.</p></div><div className="table-actions"><div className="add-many"><input aria-label="Sales rows to add" type="number" min="1" max="50" value={salesAddCount} onChange={e=>setSalesAddCount(clamp(Number(e.target.value),50))}/><button className="btn ghost" onClick={()=>addEntities('sales',salesAddCount)}>+ Add Rows</button></div><button className="btn primary" disabled={busy} onClick={()=>saveEntities('sales')}>Save</button></div></div><div className="history-wrap sales-scroll"><table className="db-table compact-db zebra-grid"><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Active</th><th></th></tr></thead><tbody>{sales.map(row=><tr key={row.id}><td><input value={row.name||''} onChange={e=>patchEntity('sales',row.id,'name',e.target.value)}/></td><td><input value={row.email||''} onChange={e=>patchEntity('sales',row.id,'email',e.target.value)}/></td><td><input value={row.phone||''} onChange={e=>patchEntity('sales',row.id,'phone',e.target.value)}/></td><td><input type="checkbox" checked={row.active!==false} onChange={e=>patchEntity('sales',row.id,'active',e.target.checked)}/></td><td><button className="row-delete" title="Delete row" aria-label={`Delete ${row.name||'Sales PIC'}`} onClick={()=>removeEntity('sales',row.id)}><UiIcon name="remove" size={16}/></button></td></tr>)}</tbody></table></div></section>
  </div>

  <section className="panel db-section signatory-section"><div className="panel-title"><div><h2>President Director</h2><p>Name/title can be edited here. The signature image is stored in GitHub as <code>public/signature-mr-herry.png</code>.</p></div><div className="table-actions"><div className="add-many"><input aria-label="Signatory rows to add" type="number" min="1" max="10" value={signAddCount} onChange={e=>setSignAddCount(clamp(Number(e.target.value),10))}/><button className="btn ghost" onClick={()=>addEntities('directors',signAddCount)}>+ Add Rows</button></div><button className="btn primary" disabled={busy} onClick={()=>saveEntities('directors')}>Save</button></div></div><div className="signatory-layout"><div className="history-wrap"><table className="db-table compact-db zebra-grid"><thead><tr><th>Name</th><th>Title</th><th>Active</th><th></th></tr></thead><tbody>{directors.map(row=><tr key={row.id}><td><input value={row.name||''} onChange={e=>patchEntity('directors',row.id,'name',e.target.value)}/></td><td><input value={row.title||''} onChange={e=>patchEntity('directors',row.id,'title',e.target.value)}/></td><td><input type="checkbox" checked={row.active!==false} onChange={e=>patchEntity('directors',row.id,'active',e.target.checked)}/></td><td><button className="row-delete" title="Delete row" aria-label={`Delete ${row.name||'director'}`} onClick={()=>removeEntity('directors',row.id)}><UiIcon name="remove" size={16}/></button></td></tr>)}</tbody></table></div><div className="signature-preview"><span>Embedded signature</span><img src="/signature-mr-herry.png" alt="President Director signature"/></div></div></section>
 </>
}
