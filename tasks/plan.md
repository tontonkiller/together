# Plan: Google OAuth Login

## Context
Magic link login is tedious (switch tabs every time). Add Google social login for one-click auth.

## Good news
- The `/auth/callback` route already handles `exchangeCodeForSession` — works for OAuth too
- Profile auto-creation already exists in the callback
- Middleware is provider-agnostic
- `avatar_url` field exists in profiles schema

## Changes

### 1. Login page (`src/app/[locale]/login/page.tsx`)
- Add a "Continue with Google" button above the magic link form
- Use `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })`
- Add a visual divider "or" between Google button and email form

### 2. i18n keys (fr.json + en.json)
- `auth.continueWithGoogle` → "Continuer avec Google" / "Continue with Google"
- `auth.or` → "ou" / "or"

### 3. Auth callback (`src/app/[locale]/auth/callback/route.ts`)
- Update profile auto-creation to use Google avatar + display name when available from `user.user_metadata`

### 4. Documentation
- Note in plan that user must configure Google OAuth provider in Supabase Dashboard (Authentication → Providers → Google)

## What does NOT change
- Middleware, Supabase client/server setup, schema, RLS policies

## Config required (user action)
- Supabase Dashboard → Authentication → Providers → Enable Google
- Set Google OAuth Client ID + Secret (from Google Cloud Console)
