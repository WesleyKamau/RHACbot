# Deployment Checklist for CORS Fix

## Pre-Deployment

- [x] CORS configuration fixed in `backend/app.py`
- [x] Test suite created (`backend/test_suite.py`)
- [x] Tests pass locally
- [ ] All changes committed to git
- [ ] Code reviewed (if applicable)

## Deployment Steps

### 1. Commit Changes
```bash
cd c:\GitHub\RHACbot

# Stage the fixed file
git add backend/app.py

# Commit with descriptive message
git commit -m "Fix CORS configuration - remove invalid origin_allow_regex parameter

- Move regex pattern into origins list
- Flask-CORS automatically detects regex patterns in origins array
- Fixes TypeError: argument of type 'function' is not iterable"

# Also commit test suite (optional but recommended)
git add backend/test_suite.py backend/run_tests.py backend/tests/README.md
git add backend/TESTING_GUIDE.md backend/FIX_SUMMARY.md
git add backend/requirements.txt
git commit -m "Add comprehensive backend test suite

- 12 test classes covering all endpoints
- 40+ test cases with mocking
- Test runner with coverage support
- Complete documentation"
```

### 2. Push to GitHub
```bash
# Push to main branch
git push origin main
```

### 3. Verify Railway Deployment

Railway should automatically detect the push and redeploy.

**Monitor Railway Logs:**
1. Go to https://railway.app
2. Select your RHACbot backend project
3. Click on "Deployments"
4. Watch the build logs

**Expected Output:**
```
Building...
✓ Build successful
Deploying...
✓ Deployment successful
```

## Post-Deployment Verification

### 1. Check Health Endpoint

Using curl:
```bash
curl https://your-backend-url.railway.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "Backend is healthy"
}
```

Using PowerShell:
```powershell
Invoke-RestMethod -Uri "https://your-backend-url.railway.app/api/health"
```

### 2. Verify CORS Headers

Test with production origin:
```bash
curl -H "Origin: https://rhacbot.wesleykamau.com" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://your-backend-url.railway.app/api/health \
     -v
```

Should include header:
```
Access-Control-Allow-Origin: https://rhacbot.wesleykamau.com
```

Test with Vercel preview origin:
```bash
curl -H "Origin: https://rhacbot-preview-abc123.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://your-backend-url.railway.app/api/health \
     -v
```

Should include header matching the Vercel origin.

### 3. Check Railway Logs

**Look for:**
✅ No TypeError exceptions
✅ "Using MongoDB database: rhac_db (env=prod)"
✅ "Chat storage: MongoDB"
✅ HTTP 200 responses for `/api/health`

**Should NOT see:**
❌ "TypeError: argument of type 'function' is not iterable"
❌ "500 Internal Server Error"
❌ "Railway rate limit of 500 logs/sec reached"

### 4. Test from Frontend

1. Go to https://rhacbot.wesleykamau.com
2. Try to add a chat or send a message
3. Open browser DevTools (F12)
4. Check Console for errors
5. Check Network tab for API calls

**Expected:**
- No CORS errors
- API calls succeed
- Status codes are 200/201

## Rollback Plan (If Needed)

If the deployment causes issues:

### Option 1: Revert via Git
```bash
# Find the commit hash before the changes
git log --oneline

# Revert to previous commit
git revert <commit-hash>
git push origin main
```

### Option 2: Rollback in Railway
1. Go to Railway dashboard
2. Click "Deployments"
3. Find previous successful deployment
4. Click "Redeploy"

## Troubleshooting

### Still seeing errors after deployment

**Check 1: Deployment Status**
- Verify Railway shows "Active" status
- Check build logs completed successfully

**Check 2: Cache Issues**
- Clear browser cache
- Try incognito/private window
- Hard refresh (Ctrl+Shift+R)

**Check 3: Code Actually Deployed**
```bash
# Check the deployed commit
git log -1
# Should show your CORS fix commit
```

**Check 4: Railway Logs**
```bash
# Look for startup messages showing correct code
# Should see CORS configuration without origin_allow_regex
```

### Frontend still shows CORS errors

1. Verify frontend is calling correct backend URL
2. Check Network tab for actual request/response headers
3. Verify origin matches one in CORS config

### Database connection issues

These are unrelated to CORS fix. Check:
- `MONGODB_URI` environment variable in Railway
- MongoDB Atlas network access whitelist
- MongoDB Atlas cluster is running

## Success Criteria

✅ All checkboxes completed:

- [ ] Changes committed and pushed
- [ ] Railway deployment successful
- [ ] Health endpoint returns 200
- [ ] No TypeError in Railway logs
- [ ] CORS headers present in responses
- [ ] Frontend can communicate with backend
- [ ] No new errors in browser console
- [ ] Test suite runs successfully locally

## Post-Deployment Actions

### Immediate (Now)
- [ ] Monitor Railway logs for 5-10 minutes
- [ ] Test health endpoint
- [ ] Verify CORS from frontend

### Short-term (24 hours)
- [ ] Check error tracking/monitoring
- [ ] Review Railway metrics
- [ ] Verify no user-reported issues

### Long-term (1 week)
- [ ] Set up automated tests in CI/CD
- [ ] Add monitoring/alerting
- [ ] Document any lessons learned

## Environment-Specific Notes

### Production (Railway)
- Auto-deploys on push to `main`
- Uses production MongoDB database
- Environment: `prod`

### Development (Local)
- Run with `python app.py` or `gunicorn app:app`
- Can use in-memory storage or dev MongoDB
- Environment: `dev`

### Testing (Local)
- Run `python test_suite.py`
- Uses in-memory storage
- No external dependencies needed

## Additional Resources

- [Railway Logs](https://railway.app/dashboard)
- [GitHub Repository](https://github.com/WesleyKamau/RHACbot)
- [Backend API Documentation](./API.md)
- [Test Suite Documentation](./tests/README.md)
- [Testing Guide](./TESTING_GUIDE.md)

## Support

If issues persist:
1. Check Railway logs for specific errors
2. Review CORS configuration in `app.py`
3. Test endpoints with curl/Postman
4. Run test suite locally to verify functionality
5. Check browser console for frontend errors

## Notes

- The CORS fix is **backward compatible** - existing origins still work
- Regex pattern `r"https://.*\.vercel\.app$"` allows all Vercel preview deployments
- Test suite includes mocks so no external services needed
- No database migrations required for this fix
