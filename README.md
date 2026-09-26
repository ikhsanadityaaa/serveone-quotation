# Serveone Quotation

Internal quotation generator for PT Serveone MRO Indonesia.

## Stack
- Next.js
- Vercel
- Supabase PostgreSQL
- ExcelJS for XLSX export
- pdf-lib for PDF export

## Main features
- Create quotation and export Excel/PDF separately.
- Client / Attention / Sales PIC master data stored in Supabase.
- Spreadsheet-style item grid with Excel paste and searchable UOM.
- Batch Client Data and Batch Sales PIC input up to 5,000 rows.
- Quotation List with search, filters, pagination, reload and delete.
- Atomic monthly quotation numbering: `SMI/YYYY-MM/0001`.
- Static Serveone logo and President Director signature from `/public`.

See `BUILD_INSTRUCTIONS.md` for local setup and deployment.

## V16 interaction updates
- Filled Create Quotation fields are highlighted in soft yellow.
- Quotation List supports multi-select checkboxes, per-quotation Reload, batch Delete with confirmation, and batch Print to a combined PDF.
- Sales PIC and Client filters use staged selections: changes only apply after **Apply**; **Clear All** only changes the draft until Apply is pressed.
- Excel signature placement is slightly realigned for the President Director block.


## V17 UI refinements
- Larger blue Print/Delete toolbar buttons on Quotation List.
- Filter popovers open to the right so they do not overlap the sidebar.
- Specification cells are explicitly left-aligned.


## V18 master-data UI
- Client Data and Quotation List default pagination: 15 rows.
- Active columns are hidden from all Master Data tables.
- Action X buttons are centered and turn red on hover.
- Edit Client supports up to 1,000 Attention rows, so existing clients with hundreds of Attention entries load completely.


## V19 UI polish
- Client Edit button is centered and turns blue on hover.
- Attention count in Client Data is centered.

### V21 pagination layout
The Rows-per-page selector is positioned immediately to the left of the Previous/Next page controls across Client Data and Quotation List.
