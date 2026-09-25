# V6 update

- UOM is no longer editable on the Database page or read from Supabase.
- UOM catalogue is embedded in `lib/uoms.ts` from `UOM STANDART2.xlsx`.
- Items UOM shows code + full meaning in the dropdown and uses a hover title, e.g. `EA (Each)`.
- Member Database pagination supports 15 / 25 / 50 / 100 / 500 rows per page.
- Quotation List pagination supports the same page sizes and pages by quotation (not by individual item row).
- Download Excel on Quotation List still downloads all filtered quotations, not only the current page.
- Sales PIC table shows about 10 rows and scrolls when more records exist.
- Delete controls use a trash-can icon throughout the editable pages.
- Database tables use the same white/light zebra pattern as the Items grid; unsaved rows are no longer highlighted yellow.
