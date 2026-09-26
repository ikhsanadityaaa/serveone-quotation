# Build & Deploy

## 1. Requirements
- Node.js 20+ recommended
- Git
- Existing Supabase project, or run `supabase/full-setup.sql` once for a new project

## 2. Environment
Create `.env.local` in the project root:

```env
SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
SUPABASE_SECRET_KEY="sb_secret_xxxxxxxxxxxxxxxxx"
```

Never commit `.env.local`.

## 3. Local run
```bash
npm install
npm run dev
```
Open `http://localhost:3000`.

## 4. Production build check
```bash
npm run build
npm start
```

## 5. Push to GitHub
```bash
git add -A
git commit -m "Update Serveone quotation"
git push origin main
```

## 6. Vercel
The existing Vercel project should redeploy automatically from `main`.
Set these Vercel Environment Variables:
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`

## Batch input notes
Client Data and Sales PIC batch editors accept up to 5,000 pasted rows. Only 100 rows are rendered per batch page so the browser remains responsive. Server writes are grouped into bulk database requests instead of one request per row.
