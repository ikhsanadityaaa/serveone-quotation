# Serveone Quotation — V4 Changes

This revision updates the item grid and Quotation List without requiring a Supabase schema migration.

## Items
- Row number header is `No`.
- New `Code` column after `No`.
- New free-text `User` column after `Brand`.
- `Qty` is placed before `UOM`.
- User values are suggested from previously saved quotations and from entries remembered in the current browser.
- Excel paste and blue fill-handle copy remain supported.

## Quotation List
- Search accepts multiple values separated by a new line. Matching is OR-style so a list of quotation numbers can be pasted at once.
- Table now mirrors the Items columns: No, Code, Item / Description, Specification, Brand, User, Lead Time, Qty, UOM, Unit Price, Amount, Remarks.
- Quotation context columns are kept at the left: Quotation No., Date, Client, Sales PIC.
- All item rows belonging to the same quotation use the same zebra background group.
- The Download Excel output follows the same column layout and respects active filters.

## Database
No SQL migration is required for this update. `Code` and `User` are stored inside the existing quotation JSON content.
