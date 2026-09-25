# Build & Deploy — Serveone Quotation Manual Database Edition

## 1. Requirements

Install Node.js and Git.

Check:

```bash
node -v
npm -v
git --version
```

## 2. Supabase

The application expects these tables to already exist:

- `sales_people`
- `uoms`
- `directors`
- `member_directory`
- `client_code_registry`
- `quotation_sequences`
- `quotations`

If starting with a new empty Supabase project, run:

```text
supabase/full-setup.sql
```

If your existing Serveone quotation database is already working, do **not** run full setup again.

This manual-database edition does not require an additional SQL upgrade.

## 3. Environment variables for local testing

Create `.env.local` beside `package.json`:

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SECRET_KEY=sb_secret_xxxxxxxxx
```

The secret key must stay server-side.

## 4. Run locally

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## 5. Database workflow

Open **Database** in the sidebar.

There is no Excel upload.

For Member Database / Sales PIC / UOM / President Director:

1. Enter how many rows you want to add.
2. Click **+ Add Rows**.
3. Type or paste data into the table.
4. Click **Save Changes** / **Save**.
5. The changed rows are written to Supabase.

The Member Database fields are:

- Client
- Attention
- Client Nm.
- Address
- Code
- Active

Client Code must be unique because it is used in quotation numbers.

## 6. Signature

No signature upload is required.

The signature is embedded in the repository at:

```text
public/signature-mr-herry.png
```

To replace the signature later, replace that file in GitHub using the same filename and redeploy.

The President Director name/title can still be edited from the Database page.

## 7. Production build test

```bash
npm run build
npm start
```

## 8. Push to GitHub

For an existing repo:

```bash
git add .
git commit -m "Manual database input"
git push
```

## 9. Vercel environment variables

In Vercel Project Settings → Environment Variables add:

```text
SUPABASE_URL
SUPABASE_SECRET_KEY
```

Then redeploy.

## 10. Important

- Browser file upload is no longer used by this edition.
- Excel/PDF generated quotations are created on demand and are not stored as files in Supabase.
- Quotation snapshots and quotation list data remain stored in Supabase.
- Multiple users can work simultaneously; quotation numbering is allocated atomically by PostgreSQL.

## V7 database upgrade
For an existing Supabase project, open Supabase > SQL Editor > New query, paste the contents of `supabase/v7-upgrade.sql`, and click Run once. This changes only the month separator for newly allocated quotation numbers from `YYYY.MM` to `YYYY-MM`.

## V8 notes
- No new Supabase migration is required for V8.
- `supabase/v7-upgrade.sql` is still required once if the quotation number function has not yet been changed to `YYYY-MM`.
- Master Data paste from Excel is handled in-browser; no file upload is used.
- Logo and President Director signature are served from `/public` and committed with the repository.

## V11 deployment
1. Run `supabase/v11-upgrade.sql` once in Supabase SQL Editor.
2. Push the source to GitHub.
3. Let Vercel redeploy.
