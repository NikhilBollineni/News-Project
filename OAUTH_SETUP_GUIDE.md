# 🔐 OAuth Setup Guide - Fix Google 500 Error

## 🚨 **IMMEDIATE FIX**

The Google 500 error occurs because OAuth credentials are not configured. Here's how to fix it:

### **Step 1: Create Environment File**

Create a `.env` file in your project root with these variables:

```bash
# NextAuth Configuration
NEXTAUTH_SECRET=your-nextauth-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Server Configuration  
NEXT_PUBLIC_SERVER_URL=http://localhost:5016

# Google OAuth (Required for Google SSO)
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# GitHub OAuth (Optional)
GITHUB_CLIENT_ID=your-github-client-id-here
GITHUB_CLIENT_SECRET=your-github-client-secret-here

# Database
MONGODB_URI=mongodb+srv://nikhilbollineni30_db_user:UFpGMGVv53gi3qpi@cluster0-azure.2bfte3e.mongodb.net/automotive-news?retryWrites=true&w=majority&appName=Clustero-Azure

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Server Port
PORT=5016
CLIENT_URL=http://localhost:3000
```

### **Step 2: Get Google OAuth Credentials**

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create/Select Project**: Create a new project or select existing
3. **Enable APIs**: 
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API" and enable it
4. **Create OAuth Credentials**:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Name: "Industry News App"
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://yourdomain.com/api/auth/callback/google` (for production)
5. **Copy Credentials**: Copy Client ID and Client Secret to your `.env` file

### **Step 3: Get GitHub OAuth Credentials (Optional)**

1. **Go to GitHub Developer Settings**: https://github.com/settings/developers
2. **Create New OAuth App**:
   - Application name: "Industry News App"
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
3. **Copy Credentials**: Copy Client ID and Client Secret to your `.env` file

### **Step 4: Generate NextAuth Secret**

Run this command to generate a secure secret:

```bash
openssl rand -base64 32
```

Or use this online generator: https://generate-secret.vercel.app/32

### **Step 5: Restart the Application**

After setting up the `.env` file:

```bash
# Stop the current servers
pkill -f "node server/server.js"
pkill -f "npm run dev"

# Restart the server
cd "/Users/nikhilbollineni/Project - News"
NODE_ENV=development MONGODB_URI="mongodb+srv://nikhilbollineni30_db_user:UFpGMGVv53gi3qpi@cluster0-azure.2bfte3e.mongodb.net/automotive-news?retryWrites=true&w=majority&appName=Clustero-Azure" PORT=5016 JWT_SECRET="your-super-secret-jwt-key-change-in-production" JWT_EXPIRES_IN="7d" CLIENT_URL="http://localhost:3000" node server/server.js &

# Restart the client
cd "/Users/nikhilbollineni/Project - News/client"
npm run dev
```

## 🎯 **QUICK FIX (Temporary)**

If you want to disable OAuth temporarily and use only email authentication:

1. The app will automatically detect missing OAuth credentials
2. SSO buttons will be hidden
3. Only email/password authentication will be available
4. This is already implemented in the current code

## ✅ **VERIFICATION**

After setup, you should see:
- ✅ Google SSO button appears (if configured)
- ✅ GitHub SSO button appears (if configured)  
- ✅ No more 500 errors
- ✅ Successful OAuth redirects

## 🚀 **PRODUCTION SETUP**

For production deployment:
1. Update `NEXTAUTH_URL` to your production domain
2. Add production redirect URIs to OAuth providers
3. Use secure secrets and environment variables
4. Enable HTTPS for all OAuth callbacks

## 📞 **SUPPORT**

If you need help with OAuth setup:
1. Check the browser console for specific error messages
2. Verify all environment variables are set correctly
3. Ensure redirect URIs match exactly
4. Test with a simple OAuth flow first

**The app will work perfectly with just email authentication while you set up OAuth!** 🎉
