# 🔐 SSO Setup Guide

## Environment Variables Required

Add these to your `.env` file:

```bash
# NextAuth Configuration
NEXTAUTH_SECRET=your-nextauth-secret-key
NEXTAUTH_URL=http://localhost:3000

# Google OAuth (Required)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth (Required)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Microsoft OAuth (Optional)
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
```

## OAuth Provider Setup

### 1. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://yourdomain.com/api/auth/callback/google` (for production)
7. Copy Client ID and Client Secret to your `.env` file

### 2. GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in application details:
   - Application name: Your App Name
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID and Client Secret to your `.env` file

### 3. Microsoft OAuth Setup (Optional)

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to "Azure Active Directory" → "App registrations"
3. Click "New registration"
4. Set redirect URI: `http://localhost:3000/api/auth/callback/microsoft`
5. Copy Application (client) ID and create a client secret
6. Add to your `.env` file

## Features Implemented

### ✅ SSO Providers
- **Google OAuth** - One-click sign in with Google
- **GitHub OAuth** - Developer-friendly GitHub authentication
- **Microsoft OAuth** - Enterprise Microsoft account support

### ✅ User Experience
- **Smart Detection** - Automatically detects existing users
- **Seamless Registration** - New users created automatically
- **Profile Sync** - Name and avatar synced from provider
- **Fallback Option** - Email/password still available

### ✅ Security Features
- **JWT Tokens** - Secure session management
- **Provider Validation** - Verified OAuth providers only
- **Account Linking** - Multiple providers per account
- **Secure Callbacks** - Protected OAuth flows

## Usage

### For Users:
1. **Login Page**: Click "Continue with Google" or "Continue with GitHub"
2. **Registration Page**: Same SSO options available
3. **Account Management**: Link/unlink providers in settings

### For Developers:
```typescript
// Check if user has SSO providers
const { data: session } = useSession();
const hasGoogle = session?.user?.providers?.includes('google');

// Sign in with specific provider
import { signIn } from 'next-auth/react';
await signIn('google');
```

## API Endpoints

- `POST /api/sso-check` - Check if user exists for SSO
- `POST /api/sso-register` - Register new user via SSO
- `GET /api/sso-providers` - Get user's connected providers
- `DELETE /api/sso-providers/:provider` - Disconnect provider

## Testing

1. Start the server: `npm run dev`
2. Go to `http://localhost:3000/login`
3. Click "Continue with Google" or "Continue with GitHub"
4. Complete OAuth flow
5. User should be automatically logged in

## Production Deployment

1. Update OAuth redirect URIs to production domain
2. Set `NEXTAUTH_URL` to production URL
3. Use strong secrets for `NEXTAUTH_SECRET`
4. Enable HTTPS for secure OAuth flows
5. Configure CORS for production domain
