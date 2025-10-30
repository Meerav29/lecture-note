# Supabase Setup Checklist

Follow these steps to fix the "row violates row-level security policy" error.

## Step 1: Run SQL Policies

1. Open your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste the entire content of `fix-all-policies.sql`
6. Click **Run** (or press Ctrl+Enter)

You should see: "RLS Policies Created Successfully!"

## Step 2: Create Storage Bucket

1. In your Supabase Dashboard, go to **Storage** (left sidebar)
2. Click **Create a new bucket**
3. Set these values:
   - **Name**: `lecture-audio`
   - **Public**: **OFF** (unchecked) - keep it private
   - **File size limit**: 500 MB (or your preference)
   - **Allowed MIME types**: Leave empty or add: `audio/*`
4. Click **Create Bucket**

## Step 3: Verify Storage Policies

After creating the bucket, the storage policies from Step 1 should automatically apply. To verify:

1. Go to **Storage** → **Policies** tab
2. Click on the `lecture-audio` bucket
3. You should see 4 policies:
   - ✅ Users can upload own audio (INSERT)
   - ✅ Users can view own audio (SELECT)
   - ✅ Users can update own audio (UPDATE)
   - ✅ Users can delete own audio (DELETE)

If policies are missing, go back to **SQL Editor** and run the storage policy section again.

## Step 4: Verify Environment Variables

Make sure your `.env.local` file has:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Get these from: **Project Settings** → **API** in your Supabase Dashboard

## Step 5: Test the App

1. Restart your Next.js dev server:
   ```bash
   npm run dev
   ```

2. Open the app and sign in
3. Try recording or uploading audio
4. It should now work without the RLS error!

## Troubleshooting

### Still getting RLS errors?

Open your browser console (F12) and check the logs. You should see:
- ✅ "Uploading to storage: [user-id]/[timestamp].[ext]"
- ✅ "Storage upload success: [path]"
- ✅ "Inserting lecture with user_id: [uuid]"
- ✅ "Lecture saved successfully: [object]"

### If you see "auth.uid() is null":

This means you're not properly authenticated. Try:
1. Sign out and sign back in
2. Clear browser cookies/cache
3. Check if cookies are enabled in your browser

### Storage bucket not found:

Make sure you created the bucket with the exact name `lecture-audio` (all lowercase, with hyphen).

### Need help?

Check the Supabase logs:
1. Go to **Database** → **Logs** in your dashboard
2. Look for any error messages related to RLS or storage
