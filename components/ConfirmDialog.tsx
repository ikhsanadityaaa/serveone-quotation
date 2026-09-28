'use client';

export default function ConfirmDialog({
 open,
 message='Are You sure want to delete this data?',
 detail,
 onYes,
 onCancel,
}:{
 open:boolean;
 message?:string;
 detail?:string;
 onYes:()=>void;
 onCancel:()=>void;
}){
 if(!open)return null;
 return <div className="confirm-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)onCancel()}}>
  <div className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-delete-title">
   <div className="confirm-icon" aria-hidden="true">!</div>
   <div className="confirm-copy">
    <h3 id="confirm-delete-title">Confirm Delete</h3>
    <p>{message}</p>
    {detail&&<small>{detail}</small>}
   </div>
   <div className="confirm-actions">
    <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>
    <button type="button" className="btn confirm-yes" onClick={onYes}>Yes</button>
   </div>
  </div>
 </div>
}
