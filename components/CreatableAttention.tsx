'use client';
import {useEffect,useMemo,useRef,useState} from 'react';

type Option={value:string;label:string};

export default function CreatableAttention({
  label,value,options,onChange,onAdd,placeholder='Type or select Attention...',disabled=false,error=false,id,className=''
}:{
  label:string;value:string;options:Option[];onChange:(v:string)=>void;onAdd:(name:string)=>Promise<void>;
  placeholder?:string;disabled?:boolean;error?:boolean;id?:string;className?:string;
}){
  const [open,setOpen]=useState(false),[adding,setAdding]=useState(false);
  const ref=useRef<HTMLDivElement>(null);
  const q=value.trim();
  const exact=useMemo(()=>options.some(o=>o.value.trim().toLocaleLowerCase()===q.toLocaleLowerCase()),[options,q]);
  const filtered=useMemo(()=>{
    const needle=q.toLocaleLowerCase();
    return options.filter(o=>!needle||o.label.toLocaleLowerCase().includes(needle)).slice(0,200);
  },[options,q]);
  const canAdd=!disabled&&!!q&&!exact;
  useEffect(()=>{
    const fn=(e:MouseEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node))setOpen(false)};
    document.addEventListener('mousedown',fn);return()=>document.removeEventListener('mousedown',fn);
  },[]);
  async function add(){
    if(!canAdd||adding)return;
    setAdding(true);
    try{await onAdd(q);setOpen(false)}finally{setAdding(false)}
  }
  return <div id={id} ref={ref} className={`field creatable-attention ${className} ${error?'field-error':''}`.trim()} data-invalid={error?'true':undefined}>
    <label>{label}</label>
    <div className="creatable-input-wrap">
      <input
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        onFocus={()=>setOpen(true)}
        onChange={e=>{onChange(e.target.value);setOpen(true)}}
        onKeyDown={e=>{if(e.key==='Enter'&&canAdd){e.preventDefault();void add()}}}
      />
      {canAdd&&<button type="button" className="attention-add-btn" disabled={adding} onClick={()=>void add()}>{adding?'Adding...':'Add'}</button>}
    </div>
    {open&&!disabled&&<div className="select-popover attention-popover">
      <div className="select-options">
        {filtered.map(o=><button type="button" key={o.value} onClick={()=>{onChange(o.value);setOpen(false)}}><span>{o.label}</span></button>)}
        {!filtered.length&&<div className="empty">No matching Attention</div>}
      </div>
    </div>}
  </div>
}
