# Product media repair

- Product photos and videos are now stored in `public/products`, so Vercel can serve them directly.
- The migration `drizzle/migrations/0002_repair_product_media.sql` updates existing Supabase product media URLs from the old Lovable-only `/__l5e/assets-v1/...` paths to `/products/...`.
- Deploy the frontend with the included `public/products` folder. Then run the SQL migration once in the correct Supabase project's SQL Editor.
- This archive intentionally excludes `.env` because it may contain credentials. Restore environment variables through Vercel/Supabase settings; do not commit secrets.
- Review the three video assignments before running the SQL if any uploaded clip depicts a different product.
