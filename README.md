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

## V8 update
See `UPDATE_V8.md` for the latest PDF/Excel quotation styling and Excel-like Master Data input changes.

## V9 notes
The PDF renderer was polished for a cleaner professional quotation: corrected logo ratio, compact aligned information rows, reduced red accents, separate Sales PIC / Email / Phone Number, neutral table styling, aligned IDR totals, and Indonesian generation date above the President Director signature. Quotation List also supports confirmed deletion without reusing quotation numbers, and Active controls / pagination / edit actions were standardized in the web UI.

## V11 notes
Run `supabase/v11-upgrade.sql` once before using the new quotation numbering format `SMI/YYYY-MM/0001`.

## V12 quotation output

V12 improves multi-page quotation output. Continuation PDF pages repeat the Serveone company header and item-table header. Currency is shown in the item column headers (`Unit Price (IDR)` / `Amount (IDR)`) rather than repeated in every item cell.

## V13 UX update
V13 adds merged quotation rows in Quotation List, read-only remarks, required-field validation and auto-scroll, sortable Notes, faster Master Data loading, center-page loading indicators, and batch Client/Attention entry with duplicate-safe upsert behavior. Client Code is no longer required in Master Data. See `UPDATE_V13.md`.
