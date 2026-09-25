# Serveone Quotation V8

## Quotation export (PDF / Excel)
- Keeps the existing Serveone quotation structure; does not copy the external sample layout.
- Serveone logo is embedded at the top-left of PDF and Excel.
- Serveone red is used for quotation accents and table headers.
- Information below `QUOTATION` is split into two columns:
  - Left: Quotation No., Date, Validity, RFQ No., Sales PIC.
  - Right (wider): Attention, Client, Address.
- `Client Nm.` is no longer printed in the quotation.
- Sales PIC is printed as three separate lines: Name, Email, Phone.
- Item table header is centered.
- Item rows are top-aligned, zebra-striped, and have bottom borders.
- Specification wraps when long.
- `Lead Time` is renamed to `Lead Time (Days)`.
- UOM prints only its code, e.g. `EA`.
- Currency values use IDR and right-aligned numbers.
- Totals are moved left to avoid colliding with Amount.
- Signature section prints `Jakarta, dd mmmm yyyy` with Indonesian month names and `President Director,`.

## Master Data input
- Client Attention popup starts with 10 editable rows.
- Attention + Address blocks can be pasted directly from Excel.
- User can add multiple Attention rows at once, up to 100 total.
- Sales PIC add popup starts with 10 editable rows.
- Name + Email + Phone blocks can be pasted directly from Excel.
- User can add multiple Sales PIC rows at once.
- Existing Sales PIC and President Director data remain directly editable.
- Master Data tables use the same bordered zebra-grid style as Items.

## Create Quotation
- Items still default to 10 rows.
- `Add Rows` now defaults to adding 10 rows at once.
- Item grid header uses `Lead Time (Days)`.

## Database
No new SQL is required for V8.
If V7's quotation-number upgrade has not been run yet, run `supabase/v7-upgrade.sql` once.
