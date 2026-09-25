# Serveone Quotation — Vercel Manual Database Edition

Next.js + Vercel + Supabase quotation generator.

This edition intentionally removes browser file uploads. All master data is maintained directly in editable tables and saved to Supabase.

## Main features

- Create Quotation
- Searchable Client / Attention / Sales PIC dropdowns
- Spreadsheet-style Items grid with Excel paste and drag-fill
- Add multiple item rows at once
- Automatic quotation number: `SMI/{Client Code}/{YYYY.MM}/{running number}`
- Excel / PDF download buttons are independent
- VAT calculation and Total Amount Include VAT
- Quotation List, filters, reload, and filtered Excel export
- Database page with editable tables for:
  - Member / Client database
  - Sales PIC
  - UOM
  - President Director name/title
- Database changes are saved directly to Supabase
- Serveone logo stored in `public/serveone-logo.png`
- President Director signature stored in `public/signature-mr-herry.png`
- No Excel upload and no signature upload from the browser

## Environment variables

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SECRET_KEY=sb_secret_xxxxx
```

Never expose `SUPABASE_SECRET_KEY` using a `NEXT_PUBLIC_` variable.
