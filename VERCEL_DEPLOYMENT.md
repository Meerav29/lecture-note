# Vercel Deployment Guide

## Common Deployment Issues & Solutions

### Issue: "Failed to create lecture" on Vercel

This usually happens due to one of these reasons:

## 1. Missing Environment Variables

**You MUST set these in Vercel Dashboard:**

1. Go to your Vercel project settings
2. Navigate to **Settings** → **Environment Variables**
3. Add these variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DEEPGRAM_API_KEY=your-deepgram-key
```

**Important:**
- The `NEXT_PUBLIC_*` variables are client-side and exposed to the browser
- Make sure you click "Add" for each variable
- **Redeploy** after adding variables (Vercel → Deployments → Redeploy)

## 2. Supabase Connection Issues

### Check if Supabase is accessible from Vercel:

1. Go to your Supabase Dashboard
2. **Settings** → **API**
3. Make sure the **URL** and **anon key** match what you put in Vercel

### Check Supabase region/network:

If your Supabase project is in a restricted region, Vercel might not be able to connect.

## 3. Storage Bucket Not Created

Make sure you created the `lecture-audio` bucket in Supabase:
- Go to **Storage** in Supabase Dashboard
- Create bucket named `lecture-audio` (private)
- Run the storage policies SQL from `add-storage-policies.sql`

## 4. API Routes Timeout

Vercel has a **10-second timeout** for Hobby plan, **60 seconds** for Pro.

If transcription is taking too long:
- Large audio files might timeout
- Consider upgrading to Vercel Pro
- Or implement background processing with Vercel Functions

## 5. Check Vercel Logs

To see the actual error:

1. Go to your Vercel project
2. Click **Deployments** → Select latest deployment
3. Click **Functions** tab
4. Find the failed request and view logs

Common errors you might see:
- `ECONNREFUSED` - Can't connect to Supabase
- `Invalid API key` - Missing or wrong env variable
- `Bucket not found` - Storage bucket doesn't exist
- `new row violates RLS policy` - Database policies not set up

## 6. Browser Console Errors

Open browser console (F12) and try recording again. Look for:
- ❌ Network errors (red in Network tab)
- ❌ CORS errors
- ❌ 401/403 authentication errors
- ❌ 500 server errors

## Testing Checklist

Before deploying to Vercel, test locally:

- [ ] Can you record audio?
- [ ] Does upload work?
- [ ] Does transcription complete?
- [ ] Are lectures saved to database?
- [ ] Can you view saved lectures?

If everything works locally but fails on Vercel:
- ✅ Environment variables issue (most common)
- ✅ CORS settings in Supabase
- ✅ Vercel function timeout

## Quick Fix Steps

1. **Verify environment variables are set in Vercel**
2. **Redeploy the app** (important - changes don't apply automatically)
3. **Check Vercel function logs** for the actual error
4. **Test the /test-auth page** on your deployed site to verify:
   - Auth works
   - Database connection works
   - Storage works

Example: `https://your-app.vercel.app/test-auth`

## Still Having Issues?

1. Check browser console for detailed error
2. Check Vercel function logs
3. Make sure Supabase URL is correct
4. Verify all RLS policies are set up (run SQL scripts)
5. Test locally with production env variables

## Debugging Commands

Test your deployed app:

```bash
# Check if environment variables are loaded
curl https://your-app.vercel.app/api/health

# Test transcription endpoint
curl -X POST https://your-app.vercel.app/api/transcribe \
  -F "file=@test-audio.mp3"
```

## Need More Help?

- Check Vercel logs: `vercel logs your-app-url`
- Check Supabase logs: Dashboard → Logs
- Run diagnostic test: Visit `/test-auth` on your deployed site
