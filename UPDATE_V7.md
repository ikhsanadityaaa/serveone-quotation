# Serveone Quotation V7

## Changes
- `Database` menu renamed to **Master Data**.
- `Member Database` redesigned as **Client Data** grouped by Client.
- Client + Code are stored once; each client can contain up to 100 Attention records.
- Add Client opens a popup. Typing an existing Client name loads its current Attention data for editing.
- Attention rows contain Attention, Address, Active, and X delete action; about 10 rows are visible before scrolling.
- Client Data table adds an automatic **No** column and removes `Client Nm.`.
- Client, Attention, and Sales PIC are sorted alphabetically after saving and in Create Quotation dropdowns.
- Sales PIC uses **Add PIC** popup with required Name, Email, and Phone. Existing Sales PIC rows remain editable.
- All delete icons are **X** again.
- UOM cell displays only the UOM code (e.g. `EA`). Dropdown options and hover tooltip show `EA (Each)`.
- Quotation number format is now `SMI/{Code}/{YYYY-MM}/{sequence}`.
- Quotation List search is a compact toolbar popover supporting multiple search values separated by new lines.
- Quotation Information input values use normal font weight.

## Supabase
Run `supabase/v7-upgrade.sql` once on an existing project. It only changes the quotation-number formatting function from `YYYY.MM` to `YYYY-MM`.
