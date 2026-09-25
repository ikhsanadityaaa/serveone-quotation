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

## V6 UI/data behavior

UOM is a fixed application catalogue sourced from `UOM STANDART2.xlsx`, so it is not managed in Supabase. Client Data and Quotation List support 15/25/50/100/500 pagination. Master Data tables use zebra rows like the Items grid, Sales PIC scrolls after roughly 10 rows, and delete actions use X icons.

## V7 Master Data model
The Master Data page now groups Client Data by Client. Client Code is entered once per Client and each Client can have up to 100 Attention/Address records. Sales PIC is managed separately and all dropdowns are alphabetically sorted.

For an existing Supabase project, run `supabase/v7-upgrade.sql` once to change new quotation numbers to `YYYY-MM`.
