'use client';
import UiIcon from './UiIcon';

const PAGE_SIZES=[15,25,50,100,500] as const;

export default function PaginationBar({page,pageSize,total,onPageChange,onPageSizeChange}:{page:number;pageSize:number;total:number;onPageChange:(page:number)=>void;onPageSizeChange:(size:number)=>void}){
 const totalPages=Math.max(1,Math.ceil(total/pageSize));
 const current=Math.min(Math.max(1,page),totalPages);
 const first=total===0?0:(current-1)*pageSize+1;
 const last=Math.min(total,current*pageSize);
 return <div className="pagination-bar">
  <div className="pagination-info">{first}-{last} of {total}</div>
  <div className="pagination-controls">
   <div className="pagination-size"><span>Rows</span><select aria-label="Rows per page" value={pageSize} onChange={e=>onPageSizeChange(Number(e.target.value))}>{PAGE_SIZES.map(size=><option key={size} value={size}>{size}</option>)}</select></div>
   <div className="pagination-buttons"><button type="button" className="icon-only-button" title="Previous" aria-label="Previous page" disabled={current<=1} onClick={()=>onPageChange(current-1)}><UiIcon name="chevronLeft" size={17}/></button><span>Page {current} / {totalPages}</span><button type="button" className="icon-only-button" title="Next" aria-label="Next page" disabled={current>=totalPages} onClick={()=>onPageChange(current+1)}><UiIcon name="chevronRight" size={17}/></button></div>
  </div>
 </div>
}
