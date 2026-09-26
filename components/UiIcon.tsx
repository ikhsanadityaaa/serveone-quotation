export type IconName='upload'|'download'|'refresh'|'duplicate'|'remove'|'search'|'excel'|'pdf'|'document'|'edit'|'chevronLeft'|'chevronRight'|'chevronUp'|'chevronDown'|'print'|'trash';

export default function UiIcon({name,size=18}:{name:IconName;size?:number}){
 const p={width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.8,strokeLinecap:'round' as const,strokeLinejoin:'round' as const,'aria-hidden':true};
 if(name==='upload')return <svg {...p}><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5"/><path d="M5 14v5h14v-5"/></svg>;
 if(name==='download')return <svg {...p}><path d="M12 4v12m0 0 4.5-4.5M12 16l-4.5-4.5"/><path d="M5 20h14"/></svg>;
 if(name==='refresh')return <svg {...p}><path d="M19 8a7.5 7.5 0 1 0 .2 7.7"/><path d="M19 3v5h-5"/></svg>;
 if(name==='duplicate')return <svg {...p}><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>;
 if(name==='remove')return <svg {...p}><path d="M6 6l12 12M18 6 6 18"/></svg>;
 if(name==='search')return <svg {...p}><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 4 4"/></svg>;
 if(name==='document')return <svg {...p}><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h4M9 12h6M9 16h6"/></svg>;
 if(name==='excel')return <svg {...p}><path d="M5 3h10l4 4v14H5z"/><path d="M15 3v5h4M8 12l4 5m0-5-4 5"/></svg>;
 if(name==='edit')return <svg {...p}><path d="M4 20h4l11-11-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/></svg>;
 if(name==='chevronLeft')return <svg {...p}><path d="m15 18-6-6 6-6"/></svg>;
 if(name==='chevronRight')return <svg {...p}><path d="m9 18 6-6-6-6"/></svg>;
 if(name==='chevronUp')return <svg {...p}><path d="m18 15-6-6-6 6"/></svg>;
 if(name==='chevronDown')return <svg {...p}><path d="m6 9 6 6 6-6"/></svg>;
 if(name==='print')return <svg {...p}><path d="M7 8V3h10v5"/><rect x="5" y="14" width="14" height="7" rx="1"/><path d="M5 17H3v-7h18v7h-2M17 12h.01"/></svg>;
 if(name==='trash')return <svg {...p}><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/></svg>;
 return <svg {...p}><path d="M5 3h10l4 4v14H5z"/><path d="M15 3v5h4M8 16v-5h2.2a1.8 1.8 0 0 1 0 3.6H8m6-3.6v5m0-5h2.5"/></svg>;
}
