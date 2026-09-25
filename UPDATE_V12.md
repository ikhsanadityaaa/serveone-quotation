# Update V12

Quotation renderer refinements:

- Keeps the thin Serveone red rule above the item-table header.
- Repeats the Serveone company header and item-table header on continuation PDF pages.
- Moves currency notation out of item cells:
  - `Unit Price (IDR)`
  - `Amount (IDR)`
  - item cells contain numbers only.
- Restores the earlier visual color hierarchy: muted blue-grey labels/address, restrained Serveone-red accents, dark body text.
- Enlarges item-table text while retaining wrapped Specification cells.
- Keeps UOM centered and numeric price/amount values right aligned.
- Keeps totals right aligned; Total Amount Include VAT uses the Serveone accent.
- Excel export mirrors the new item headers and no longer prefixes item-level prices with `IDR`.
- Excel print settings repeat the quotation header rows when printed across multiple pages.

No Supabase SQL update is required for V12.
