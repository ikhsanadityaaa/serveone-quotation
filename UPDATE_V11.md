# Serveone Quotation V11

- Quotation number format is now `SMI/YYYY-MM/0001` (Client Code removed from the number).
- Item `Code` is removed from Create Quotation, PDF/Excel quotation output, Quotation List, and Quotation List Excel export.
- Sales PIC master table now has an automatic `No` column.
- Quotation List now has an automatic quotation `No` column at the far left; item numbering remains as `Item No`.
- Reload action in Quotation List is icon-only; the Action column does not receive row-hover styling.
- Notes reload now preserves the saved note order exactly and no longer re-inserts/repositions Payment Condition.
- PDF quotation: no red line above QUOTATION; all text is black; table font is larger; UOM is centered; totals are a compact bordered table aligned to the right.
- A one-time Supabase SQL update is required: run `supabase/v11-upgrade.sql`.
