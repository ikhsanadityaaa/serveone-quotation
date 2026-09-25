'use client';

export default function LoadingOverlay({show,label='Loading...'}:{show:boolean;label?:string}){
 if(!show)return null;
 return <div className="loading-overlay" role="status" aria-live="polite"><div className="loading-toast"><span className="loading-spinner"/><b>{label}</b></div></div>
}
