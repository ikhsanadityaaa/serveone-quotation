# V13 Update

## Quotation List
- Added automatic **No** column at the far left (per quotation, not per item).
- Quotation-level cells (No, Quotation No., Date, Client, Sales PIC, Action) are merged vertically when a quotation has multiple item rows.
- Remarks are read-only in Quotation List.
- Action stays as the right-most normal column and no longer overlays other values.
- All table headers are centered.
- Center-page loading indicator added while list data/export/delete operations are processing.

## Create Quotation
- Required fields: Date, Validity, Sales PIC, Client, Attention.
- Missing required fields are highlighted red and the page automatically scrolls to the first missing field when Download PDF/Excel is clicked.
- Date and Validity controls are compact single-row height.
- RFQ No. remains tall enough to align with the Sales PIC selector when Sales details are shown.
- Client / Attention / Address values use normal font weight.
- Notes can be reordered with up/down icon buttons and the saved order is preserved in quotation content.
- Loading indicator added while master data, reloaded quotations, PDF, or Excel are processing.

## Master Data performance and UX
- Master Data no longer downloads the member directory twice. `/api/masters?scope=core` only loads Sales PIC + signatory data while Client Data comes from `/api/clients`.
- Added center-page loading indicator.
- Removed Client Code from Add/Edit Client and Client Data UI.
- Client Data remains editable using Edit Client.
- Client address is entered once per client; Attention rows contain only Attention + Active.
- Added **Batch Add** for Client Data with an Excel-like table (default 10 rows, expandable to 500).
- Batch columns: Client, Address, Attention, Active.
- Pasting from Excel is supported.
- If the client already exists, new Attention values are added to the existing client.
- Duplicate Attention names for the same client are skipped (case-insensitive), so they are not inserted twice.
- Sales PIC remains editable and its Add PIC table supports multi-row Excel paste.
- Client, Attention, and Sales PIC continue to sort alphabetically.

## Signatory date
- `Jakarta, dd MMMM yyyy` above `President Director,` remains dynamic and uses the current Asia/Jakarta date when Excel/PDF is generated.

No Supabase SQL migration is required for V13.
