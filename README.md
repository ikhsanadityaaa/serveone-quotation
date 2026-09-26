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
