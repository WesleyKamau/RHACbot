# Railway Environment Variables Setup

## Required Environment Variables

Make sure these are configured in your Railway project:

### 1. ADMIN_PASSWORD (REQUIRED)
- **Purpose**: Password for authentication and message sending (used by both frontend and backend)
- **Environment Variable Name**: `ADMIN_PASSWORD`
- **How to set**: 
  1. Go to your Railway project
  2. Click on your backend service
  3. Go to "Variables" tab
  4. Add: `ADMIN_PASSWORD` = `your_secure_password`
- **Important**: This MUST be set in Railway for authentication to work

### 2. GROUPME_ACCESS_TOKEN (REQUIRED)
- **Purpose**: Access token for GroupMe API integration
- **How to get**: 
  1. Go to https://dev.groupme.com/
  2. Log in with your GroupMe account
  3. Click "Access Token" in the top right
  4. Copy the token
- **How to set**: Add `GROUPME_ACCESS_TOKEN` = `your_token` in Railway Variables

### 3. MONGODB_URI (OPTIONAL)
- **Purpose**: Connection string for MongoDB database
- **Default**: If not set, app uses in-memory storage (not recommended for production)
- **How to set**: Add `MONGODB_URI` = `mongodb+srv://...` in Railway Variables

### 4. ENV (OPTIONAL)
- **Purpose**: Environment identifier (dev/staging/prod)
- **Default**: `dev`
- **How to set**: Add `ENV` = `prod` in Railway Variables

## Verification

After setting environment variables:
1. Redeploy your service
2. Check logs for: `ADMIN_PASSWORD environment variable is not configured` errors
3. Test the `/api/auth` endpoint with your password
4. If successful, you should get: `{"message": "Authenticated"}`

## Security Notes

⚠️ **Never commit environment variables to git**
⚠️ **Use strong passwords for ADMIN_PASSWORD**
⚠️ **Keep your GROUPME_ACCESS_TOKEN private**
