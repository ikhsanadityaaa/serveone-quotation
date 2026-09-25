export type SalesPerson = { id:string; name:string; email?:string|null; phone?:string|null; active?:boolean };
export type MemberRecord = { id:string; mem_id?:string|null; member_name:string; op_unit_id?:string|null; op_unit_name:string; client_id_external?:string|null; client_name:string; address:string; client_code:string; active?:boolean };
export type Director = { id:string; name:string; title:string; signature_path?:string|null; active?:boolean };
export type Uom = { id:string; code:string; name?:string|null; active?:boolean };
export type QuoteItem = { code:string; productName:string; spec:string; brand:string; user:string; leadTime:string; qty:number; uom:string; unitPrice:number; remarks:string };
export type QuoteContent = {
  quotationDate:string; validityDays:number; vatRate:number; paymentCondition:string; rfqNo:string;
  salesId:string; salesName:string; salesEmail?:string; salesPhone?:string;
  clientId:string; clientName:string; clientNm:string; clientCode:string; attention:string; address:string;
  items:QuoteItem[]; notes:string[];
  directorId:string; directorName:string; directorTitle:string; directorSignaturePath?:string;
  companyName:string; companyAddress:string;
};
export type StoredQuotation = { id:string; quotation_no:string; quotation_date:string; client_id?:string|null; client_name:string; client_code:string; sales_pic_id?:string|null; sales_name:string; total_amount:number; content_hash:string; content:QuoteContent; source_quotation_id?:string|null; created_at:string };
