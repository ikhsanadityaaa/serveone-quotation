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
