# Deploying to GitHub Pages

Your DNDC Resource Hub app is ready to deploy! Here's how to set it up:

## Quick Setup (5 minutes)

### Step 1: Create Main Branch on GitHub
1. Go to: https://github.com/KC2FLYCODES/DNDC
2. Click the branch dropdown (currently shows your feature branch)
3. Type `main` in the text box
4. Click "Create branch: main from 'claude/test-setup-011CUmgj5npY2FAbM2tSaULi'"

### Step 2: Set Main as Default Branch
1. Go to: https://github.com/KC2FLYCODES/DNDC/settings/branches
2. Under "Default branch", click the switch icon
3. Select `main` from the dropdown
4. Click "Update" and confirm

### Step 3: Enable GitHub Pages
1. Go to: https://github.com/KC2FLYCODES/DNDC/settings/pages
2. Under "Build and deployment":
   - **Source:** Select "GitHub Actions"
3. The deployment will start automatically!

### Step 4: Add Environment Secrets (Optional)
For Supabase functionality:
1. Go to: https://github.com/KC2FLYCODES/DNDC/settings/secrets/actions
2. Click "New repository secret" and add:
   - Name: `REACT_APP_SUPABASE_URL`
     Value: `https://tbgzelmgdvkgdepirdzn.supabase.co`

   - Name: `REACT_APP_SUPABASE_ANON_KEY`
     Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRiZ3plbG1nZHZrZ2RlcGlyZHpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NDUyMTQsImV4cCI6MjA3MzEyMTIxNH0.n0N5bhK3u42ILdMxts3OhqZOHbe6oJjhtVa-xjAPKSY`

   - Name: `REACT_APP_API_URL`
     Value: `https://your-backend-url.com` (or leave blank for now)

### Step 5: Watch It Deploy!
1. Go to: https://github.com/KC2FLYCODES/DNDC/actions
2. You'll see the "Deploy to GitHub Pages" workflow running
3. Wait 2-3 minutes for completion
4. Visit: **https://kc2flycodes.github.io/DNDC**

---

## Your App Will Be Live At:
### 🌐 https://kc2flycodes.github.io/DNDC

---

## What's Included:
✅ Multi-tenant Resource Hub platform
✅ Admin dashboard
✅ Financial calculator
✅ Community board
✅ Programs & documents management
✅ Application tracker
✅ Mobile-ready design
✅ Supabase backend integration

---

## Troubleshooting:

**404 Error?**
- Make sure you created the `main` branch
- Make sure GitHub Pages is enabled with "GitHub Actions" as source
- Wait 2-3 minutes after the workflow completes

**App loads but no data?**
- Add the Supabase secrets (Step 4 above)
- Trigger a new deployment by pushing a commit

**Workflow failing?**
- Check the Actions tab for error details
- Make sure Node.js 18+ is being used in the workflow

---

## Alternative: Deploy via gh-pages Command

If you prefer manual deployment:

```bash
cd frontend
npm run deploy
```

This will deploy to the `gh-pages` branch (you'll need to enable it in Settings → Pages).

---

## Need Help?
Check the deployment workflow at: `.github/workflows/deploy.yml`
