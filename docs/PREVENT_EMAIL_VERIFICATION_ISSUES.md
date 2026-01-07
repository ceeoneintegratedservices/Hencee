# Preventing Email Verification Issues

This document outlines the prevention mechanisms implemented to avoid email verification issues when creating users through the admin interface.

## Problem

When administrators create users through the admin interface (`/users-roles` page or order creation flow), those users were not automatically email-verified. This caused login failures because the backend requires email verification before allowing login.

## Solutions Implemented

### 1. Auto-Verify Admin-Created Users (Default Behavior)

**Frontend Implementation:**
- All users created via the admin interface are automatically marked as `isEmailVerified: true`
- This applies to:
  - Users created on the `/users-roles` page
  - Users created during order creation in `CreateOrderModal`

**Code Locations:**
- `src/app/users-roles/page.tsx` - User creation form
- `src/components/CreateOrderModal.tsx` - Customer account creation
- `src/services/users.ts` - `CreateUserPayload` interface updated to include `isEmailVerified?: boolean`

### 2. Manual Email Verification Endpoint

**New API Endpoint:**
```typescript
POST /api/ceeone/users/:id/verify-email
Authorization: Bearer <admin-token>
```

**Frontend Function:**
```typescript
import { verifyUserEmail } from '@/services/users';

// Verify a user's email
await verifyUserEmail(userId);
```

**Code Location:**
- `src/services/users.ts` - `verifyUserEmail()` function
- `src/config/api.ts` - `userVerifyEmail` endpoint

### 3. Backend Requirements

The backend must support:

1. **Accept `isEmailVerified` in Create User DTO:**
   ```typescript
   {
     email: string;
     name: string;
     phone: string;
     password: string;
     roleId: string;
     isEmailVerified?: boolean; // Optional, defaults to false for public signups
   }
   ```

2. **Auto-verify when `isEmailVerified: true`:**
   - When creating a user with `isEmailVerified: true`, the backend should:
     - Set the user's `isEmailVerified` field to `true`
     - Skip sending verification emails
     - Allow immediate login

3. **Admin Verify Email Endpoint:**
   ```typescript
   POST /api/ceeone/users/:id/verify-email
   // Should verify the user's email without requiring a verification code
   ```

## How It Works

### User Creation Flow

1. **Admin creates user** via `/users-roles` page
2. **Frontend sends** `isEmailVerified: true` in the payload
3. **Backend creates user** with verified email status
4. **User can login immediately** without email verification

### Manual Verification Flow

1. **Admin identifies** unverified user
2. **Admin calls** `verifyUserEmail(userId)` function
3. **Backend verifies** the user's email
4. **User can now login**

## Prevention Checklist

- [x] Frontend sends `isEmailVerified: true` for admin-created users
- [x] `CreateUserPayload` interface includes `isEmailVerified` field
- [x] User creation in `/users-roles` page auto-verifies
- [x] User creation in `CreateOrderModal` auto-verifies
- [x] Manual verification function available
- [x] API endpoint configured for manual verification

## Backend Checklist

- [ ] Backend accepts `isEmailVerified` in Create User DTO
- [ ] Backend auto-verifies when `isEmailVerified: true`
- [ ] Backend implements `POST /api/ceeone/users/:id/verify-email` endpoint
- [ ] Backend skips verification email when `isEmailVerified: true`

## Testing

### Test Admin-Created User Login

1. Create a user via `/users-roles` page
2. Try to login immediately with the created credentials
3. **Expected:** Login should succeed without email verification

### Test Manual Verification

1. Create a user (or find an unverified user)
2. Call `verifyUserEmail(userId)` function
3. Try to login
4. **Expected:** Login should succeed after verification

## Notes

- Public signups (via `/signup` page) should **NOT** be auto-verified
- Only admin-created users should be auto-verified
- The `isEmailVerified` field is optional and defaults to `false` for backward compatibility
- This prevents the "email not verified" login error for internal staff accounts

