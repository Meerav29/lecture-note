# Supabase Setup Instructions

Follow these steps to set up your Supabase backend for Lecture Note.

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" or "New Project"
3. Sign in with GitHub (recommended) or email
4. Create a new organization if needed
5. Create a new project:
   - Project name: `lecture-note` (or your preference)
   - Database password: **Save this securely!**
   - Region: Choose closest to your users
   - Click "Create new project" (takes ~2 minutes)

## 2. Get Your API Keys

Once your project is ready:

1. Go to **Project Settings** (gear icon in sidebar)
2. Click **API** in the left menu
3. Copy the following values:
   - `URL` → This is your `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → This is your `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

4. Add these to your `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
```

## 3. Run the Database Schema

1. In your Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click **New Query**
3. Copy the entire contents of `lib/supabase/schema.sql` from this project
4. Paste it into the SQL editor
5. Click **Run** (or press Cmd/Ctrl + Enter)
6. You should see "Success. No rows returned"

This creates:
- `lectures` table
- `lecture_content` table
- `lecture_chats` table
- All necessary indexes
- Row Level Security (RLS) policies
- Triggers for auto-updating timestamps

## 4. Set Up Storage Bucket

1. In Supabase dashboard, click **Storage** (left sidebar)
2. Click **New bucket**
3. Bucket name: `lecture-audio`
4. **Make sure "Public bucket" is UNCHECKED** (private)
5. Click **Create bucket**

### Set up Storage Policies

1. Click on the `lecture-audio` bucket
2. Click **Policies** tab
3. Click **New policy** → **For full customization**
4. Create the following policies:

**Policy 1: Users can upload own audio**
```sql
CREATE POLICY "Users can upload own audio"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lecture-audio' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

**Policy 2: Users can view own audio**
```sql
CREATE POLICY "Users can view own audio"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'lecture-audio' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

**Policy 3: Users can delete own audio**
```sql
CREATE POLICY "Users can delete own audio"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'lecture-audio' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## 5. Configure Email Authentication

1. Go to **Authentication** → **Providers** in Supabase
2. Email provider should be enabled by default
3. Scroll to **Email Templates** to customize signup emails (optional)
4. For production, configure your own SMTP server

### Optional: Enable Google OAuth

1. In **Authentication** → **Providers**
2. Find **Google** and click to expand
3. Toggle **Enable Google**
4. Follow instructions to create Google OAuth credentials
5. Add the Client ID and Client Secret
6. Save

## 6. Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Visit http://localhost:3000
3. Click "Get Started Free"
4. Try to sign up with an email
5. Check your email for the confirmation link
6. After confirming, you should be able to sign in

## 7. Verify Database Tables

1. Go to **Table Editor** in Supabase
2. You should see:
   - `lectures`
   - `lecture_content`
   - `lecture_chats`
3. All tables should show "0 rows"

## 8. Check Row Level Security

1. In **Table Editor**, click on any table
2. Click the **…** menu → **View Policies**
3. You should see multiple policies for SELECT, INSERT, UPDATE, DELETE
4. If not, re-run the schema.sql file

## Troubleshooting

### "Failed to fetch session"
- Double-check your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Make sure they're in `.env.local`
- Restart your dev server

### "Row Level Security prevents access"
- Make sure you're signed in
- Verify the RLS policies were created (step 8)
- Check the SQL Editor for any errors

### "Email not confirmed"
- Check your spam folder
- In Supabase → **Authentication** → **Users**, you can manually confirm users for testing
- For local development, you can disable email confirmation in **Authentication** → **Providers** → **Email** → **Confirm email** (toggle off)

### "Storage policy error"
- Verify storage bucket name is exactly `lecture-audio`
- Make sure bucket is set to PRIVATE
- Re-check the storage policies

## Next Steps

Once setup is complete, you can:
- Sign up for an account
- Create your first lecture
- Record or upload audio
- Generate notes and flashcards

All data will be stored in your Supabase project!

## Production Checklist

Before deploying to production:

- [ ] Set up custom domain for Supabase (optional)
- [ ] Configure custom SMTP for emails
- [ ] Set up rate limiting
- [ ] Review and adjust storage limits
- [ ] Enable Supabase backups
- [ ] Set up monitoring and alerts
- [ ] Add your production URL to **Authentication** → **URL Configuration**
