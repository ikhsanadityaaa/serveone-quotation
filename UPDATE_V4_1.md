# Serveone Quotation V4.1

Changes from V4:

- Items grid columns are: **No, Code, Item / Description, Specification, Brand, User, Lead Time, Qty, UOM, Unit Price, Amount, Remarks**.
- Added editable VAT rate below the Items grid.
- VAT defaults to **11%** for a new browser profile.
- The last VAT rate entered is remembered in the browser and becomes the default for the next new quotation.
- Reloaded quotations use the VAT rate saved in that quotation.
- Changing VAT changes the quotation content hash. If it is changed and later returned exactly to the original rate before export, the quotation is treated as unchanged.
- Totals shown are:
  1. Total Amount (before VAT)
  2. Total VAT X%
  3. Total Amount Include VAT
- Excel and PDF quotation output now include the same VAT calculation.
- New quotation `total_amount` values stored in Supabase represent the amount including VAT.
- No Supabase SQL migration is required for V4.1 because VAT is stored inside the existing quotation JSON content.
