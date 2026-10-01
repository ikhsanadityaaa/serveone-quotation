# Serveone Quotation V41

## V41 changes
- Revisions now stay under one base quotation number: `SMI/YYYY-MM/0001`, then `/REV-1`, `/REV-2`, and so on.
- KPI Clients / Quotes / Amount use only the newest revision of each logical quotation, so older negotiated prices are not double-counted.
- Quotation History adds **Latest Quo**. Only the newest record of a revised quotation shows a blue **Latest** badge; quotations that were never revised stay unlabeled.
- Quotation History > Download Excel now offers **All Quotation** or **Latest Quotation Only**.
- Qty is wider and displays Indonesian thousands separators (for example `10.000`).
- Lead Time accepts digits only.
- Lead Time and UOM can be filled down with the blue drag handle.
- Wrapped item rows now keep every column at the same row height, like Excel.
- Existing Supabase projects must run `supabase/v41-upgrade.sql` once before deploying V41. Existing historical quotation numbers are preserved; future revisions use `/REV-N`.

# Serveone Quotation V28

## V28 changes
- New quotations start with `Payment condition: 30 days after issue invoice` as Note #1.
- Notes can still be reordered with the up/down controls.
- The exact Notes order is saved with the quotation and restored unchanged when the quotation is reloaded.
- Existing quotations keep their previously saved Notes order.
- No Supabase SQL change is required for V28.

# Serveone Quotation

Internal quotation generator for PT Serveone MRO Indonesia.

## Stack
- Next.js
- Vercel
- Supabase PostgreSQL
- ExcelJS for XLSX export
- pdf-lib for PDF export

## Main features
- Create quotation and export PDF from the Create Quotation page. Quotation History still supports filtered Excel export.
- Client / Attention / Sales PIC master data stored in Supabase.
- Spreadsheet-style item grid with Excel paste and searchable UOM.
- Batch Client Data and Batch Sales PIC input up to 5,000 rows.
- Quotation History with search, filters, pagination, reload and delete.
- Atomic monthly quotation numbering: `SMI/YYYY-MM/0001`.
- Static Serveone logo and President Director signature from `/public`.

See `BUILD_INSTRUCTIONS.md` for local setup and deployment.

## V16 interaction updates
- Filled Create Quotation fields are highlighted in soft yellow.
- Quotation History supports multi-select checkboxes, per-quotation Reload, batch Delete with confirmation, and batch Print to a combined PDF.
- Sales PIC and Client filters use staged selections: changes only apply after **Apply**; **Clear All** only changes the draft until Apply is pressed.
- Excel signature placement is slightly realigned for the President Director block.


## V17 UI refinements
- Larger blue Print/Delete toolbar buttons on Quotation History.
- Filter popovers open to the right so they do not overlap the sidebar.
- Specification cells are explicitly left-aligned.


## V18 master-data UI
- Client Data and Quotation History default pagination: 15 rows.
- Active columns are hidden from all Master Data tables.
- Action X buttons are centered and turn red on hover.
- Edit Client supports up to 1,000 Attention rows, so existing clients with hundreds of Attention entries load completely.


## V19 UI polish
- Client Edit button is centered and turns blue on hover.
- Attention count in Client Data is centered.

### V22 pagination layout
The Rows-per-page selector is positioned immediately to the left of the Previous/Next page controls across Client Data and Quotation History.

## V23 UI update
- All destructive X actions use the same custom confirmation dialog: “Are You sure want to delete this data?” with Yes / Cancel.
- Quotation History bulk Delete uses the same confirmation dialog.
- Edit Client > Attention has row checkboxes, select-all, and bulk Delete above the table.


## V24 changes
- Populated Create Quotation fields now use a green outline (white fill).
- Serveone issuer address is editable and saved in Master Data.
- Existing deployments must run `supabase/v24-upgrade.sql` once.
- Qty cannot be negative, including pasted values.
- Add Rows counters reject negative input.


## V25
- Create Quotation > Issuer address is directly editable and can be saved to Supabase.
- Checkbox focus no longer shows an extra blue border/box.

## V26 UI update
- Serveone Information now uses a table layout consistent with President Director.
- Columns: Company and Serveone Address only; no Action column.
- Save Address remains available in the section header.


## V27
- The Issuer section on Create Quotation is read-only.
- Serveone company address is edited and saved only from Master Data.

## V29
- Batch Add Client Data now provides one scrollable 3,000-row grid with no pagination.
- The grid uses virtual scrolling so only the visible rows are mounted, while paste/save still handles up to 3,000 rows.
- Client batch paste updates only affected rows in memory and the API continues bulk/chunk database writes for speed.

## V32
- Create Quotation Attention is now a typeable combobox.
- If the typed Attention does not exist for the selected Client, an Add button appears.
- Add saves the new Attention directly to the selected Client and refreshes the local Attention list immediately.


## V34 item grid
- Added Code before Item / Description.
- Lead Time now has a Days/Week selector, default Days.
- Item/Description, Specification, and Remarks auto-wrap and grow row height.
- Rebalanced Qty, UOM, Unit Price, Specification, and Brand widths.
- PDF, history, reload, and Quotation History Excel export preserve Code and Lead Time unit.

## V37 updates
- UOM in Create Quotation is now a true searchable dropdown with a compact arrow control; cells still display only the selected UOM code while the dropdown shows code + description.
- Items Action column remains pinned at the far right and its action buttons no longer change styling on hover.

### V38
- UOM is a compact searchable dropdown with a blank search box each time it opens.
- UOM control visually follows the compact Lead Time control pattern.
- Items Actions column was removed completely.

## V42 changes
- Items grid supports direct Excel paste into Lead Time, Qty, and Unit Price with numeric validation; invalid pasted values show an English numbers-only warning.
- Fixed Unit Price paste draft-state issue that could make pasted values appear one row lower.
- Mouse drag can select a rectangular range of editable item cells; Delete/Backspace clears the selected range.
- Wrapped item rows synchronize the full row height across all columns.
- Item Remarks is horizontally centered.
- Quotation History uses a frozen header inside its own scroll viewport and a synchronized horizontal scrollbar that appears above the table on hover.
- Quotation History alignment: Item/Description and Specification left, Brand and Qty centered, Amount right; headers stay centered.
- PDF wrapping now breaks very long tokens so Item/Description and Specification stay inside their columns.
- PDF table widths rebalance Lead Time/Unit Price narrower and Brand/Qty/Remarks wider.
- Signature date now follows the quotation Date field exactly.

No new SQL is required for V42. V41 revision SQL is still required if it has not already been applied.

## V44 changes
- Remarks cells are vertically centered within taller item rows while remaining left-aligned.
- Mouse drag inside editable inputs/textareas (including Qty) now selects characters normally, so partial values can be deleted or replaced.
- Dragging from an editable cell into another cell still switches to rectangular spreadsheet range selection.

### V46
- Quotation History Qty header is centered.
- Data-column headers can be pinned one at a time. The pinned column alone stays at the far left while horizontal scrolling; earlier columns continue scrolling away.
- Pinned body cells keep the quotation-group zebra background so overlapping content remains opaque and readable.

## V59
- Quotation History floating header now mirrors the live table header's exact cell positions and widths instead of rebuilding column widths in a second table.
- Header alignment stays synchronized during horizontal scroll, browser scaling, compact column widths, and single-column pinning.
