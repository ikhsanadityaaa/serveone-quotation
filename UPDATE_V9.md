# V9 — PDF polish, centered Active controls, and quotation deletion

## PDF quotation
- Preserve the original Serveone logo aspect ratio so it is not stretched.
- PT Serveone MRO Indonesia is larger and black.
- Red is reduced to restrained accent lines; information blocks no longer use grey panel backgrounds.
- Quotation information uses compact rows with a dedicated aligned colon column.
- Sales details are separate rows: Sales PIC, Email, Phone Number.
- Client information remains in the wider right column: Attention, Client, Address.
- Table header uses a light neutral background with black centered labels and a thin Serveone-red accent line.
- Body rows keep zebra shading, bottom rules, top alignment, wrapped Specification, and requested per-column alignment.
- PDF item order is Lead Time (Days), Qty, UOM.
- Currency fields display `IDR` on the left and the number right-aligned.
- Totals are moved left and use the same currency alignment.
- Notes use neutral black text.
- Signature block prints `Jakarta, dd MMMM yyyy` using the actual generation date in Asia/Jakarta and Indonesian month names, followed by `President Director,`.

## Master Data / web
- Active columns are centered checkboxes, including the Client Data list.
- Client Edit is now an icon-only pencil button.
- Previous / Next pagination controls are icon-only arrow buttons.

## Quotation List
- A quotation can now be deleted after a confirmation warning.
- Deleting a quotation does not roll back or reuse its quotation sequence number.
- Revisions that reference a deleted quotation are unlinked before deletion, so deletion does not break the revision chain.

No new Supabase SQL migration is required for V9.
