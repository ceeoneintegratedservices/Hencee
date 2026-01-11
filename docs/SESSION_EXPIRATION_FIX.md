# Session Expiration and Login/Logout Loop Fix

## Problem
When users left their PC for a while and returned to the app, they experienced a login/logout loop where the app would repeatedly try to log in and show "session expired" messages. This was caused by:

1. **Expired tokens**: Access tokens expired after a period of inactivity
2. **Multiple refresh attempts**: When tokens expired, multiple API calls (like notifications polling every 30 seconds) would all try to refresh simultaneously
3. **No expiration checking**: The app didn't check if tokens were expired before making API calls
4. **Multiple redirects**: When refresh failed, multiple components would try to redirect to login simultaneously, creating a loop

## Solution

### 1. Token Expiration Utilities (`src/utils/tokenUtils.ts`)
Created a new utility module with functions to:
- **`isTokenExpired(token)`**: Check if a JWT token is expired by parsing the `exp` claim
- **`getTokenExpiration(token)`**: Get the expiration timestamp from a token
- **`checkAndClearExpiredTokens()`**: Proactively check and clear expired tokens
- **`redirectToLogin()`**: Safely redirect to login with a flag to prevent multiple redirects
- **`hasValidAuth()`**: Check if we have valid authentication tokens

### 2. Updated `authFetch` (`src/services/authFetch.ts`)
- **Pre-flight token check**: Before making API calls, check if tokens are expired
- **Proactive clearing**: Clear expired tokens before attempting refresh
- **Prevent multiple redirects**: Use `redirectToLogin()` utility instead of direct `window.location.href`
- **Skip check for auth endpoints**: Don't check expiration for login/refresh endpoints

### 3. Updated Header Component (`src/components/Header.tsx`)
- **Stop polling when expired**: Check `hasValidAuth()` before fetching notifications
- **Stop polling on error**: If notifications fetch fails with session expired error, stop the interval
- **Prevent unnecessary API calls**: Don't make API calls when tokens are expired

### 4. Updated Error Handler (`src/utils/errorHandler.ts`)
- **Use redirect utility**: Use `redirectToLogin()` instead of direct redirect to prevent loops

## How It Works

### Token Expiration Check Flow

```
1. User makes API call
   ↓
2. authFetch checks if token is expired (before making request)
   ↓
3. If expired:
   - Clear expired tokens
   - Check if refresh token exists
   - If no refresh token → redirect to login (once)
   - If refresh token exists → let 401 handler try refresh
   ↓
4. If refresh fails → redirect to login (once, using flag)
```

### Polling Prevention Flow

```
1. Component sets up interval (e.g., notifications every 30s)
   ↓
2. Before each fetch, check hasValidAuth()
   ↓
3. If no valid auth:
   - Skip the fetch
   - Don't make API call
   - Interval continues but does nothing
   ↓
4. If error occurs:
   - Check if error is "Session expired" or "Unauthorized"
   - If yes, stop polling
```

## Benefits

1. **No more login/logout loops**: The redirect flag prevents multiple simultaneous redirects
2. **Proactive token management**: Tokens are checked and cleared before making API calls
3. **Reduced unnecessary API calls**: Components stop polling when tokens are expired
4. **Better user experience**: Users see a single redirect to login instead of a loop
5. **Automatic cache clearing**: Expired tokens are automatically cleared from localStorage

## Testing

To test the fix:

1. **Login to the app**
2. **Wait for tokens to expire** (or manually expire them by modifying localStorage)
3. **Return to the app after a period of inactivity**
4. **Expected behavior**:
   - App should redirect to login once
   - No repeated "session expired" messages
   - No login/logout loop
   - Polling should stop automatically

## Configuration

The token expiration check includes a 5-second buffer to account for clock skew:
```typescript
// Check if token expires in the next 5 seconds (buffer for clock skew)
const now = Math.floor(Date.now() / 1000);
return exp < (now + 5);
```

This ensures tokens are considered expired slightly before they actually expire, preventing edge cases.

## Files Modified

1. `src/utils/tokenUtils.ts` (new file)
2. `src/services/authFetch.ts`
3. `src/components/Header.tsx`
4. `src/utils/errorHandler.ts`

## Related Documentation

- See `docs/BOOK_STOREKEEPER_ROLE.md` for information about role-based access control
