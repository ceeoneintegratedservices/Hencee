# Fix: Update User Role Not Working

## Issue
When trying to update a user's role as admin from the Users & Roles page, the update was not working and no error messages were shown.

## Root Causes

1. **Silent Error Handling**: The `handleAssignRole` function was catching errors but not displaying them to the user (had a comment "no-op; you could show an error toast if desired")
2. **Poor Error Handling in Service**: The `assignUserRole` function in `src/services/users.ts` was not checking if the response was OK before parsing JSON
3. **No User Feedback**: Users had no way to know if the update failed or what went wrong

## Solutions Implemented

### 1. Fixed Error Handling in `handleAssignRole` (src/app/users-roles/page.tsx)

**Before:**
```typescript
const handleAssignRole = async (userId: string, roleId: string) => {
  try {
    await assignUserRole(userId, roleId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, roleId } : u));
    showSuccess('Updated', 'User role updated');
  } catch (e: any) {
    // no-op; you could show an error toast if desired
  }
};
```

**After:**
```typescript
const handleAssignRole = async (userId: string, roleId: string) => {
  try {
    setApiLoading(true);
    const updatedUser = await assignUserRole(userId, roleId);
    // Refresh users list to get the latest data from backend
    await fetchUsers();
    showSuccess('Updated', 'User role updated successfully');
  } catch (e: any) {
    console.error('Error assigning role:', e);
    const errorMessage = e?.message || e?.error || 'Failed to update user role';
    showSuccess('Error', errorMessage);
    // Revert the UI change by refreshing users
    await fetchUsers();
  } finally {
    setApiLoading(false);
  }
};
```

**Improvements:**
- ✅ Shows error messages to users
- ✅ Refreshes user list after update to get latest data from backend
- ✅ Reverts UI changes if update fails
- ✅ Shows loading state during update

### 2. Improved Error Handling in `assignUserRole` (src/services/users.ts)

**Before:**
```typescript
export async function assignUserRole(userId: string, roleId: string): Promise<User> {
  try {
    const url = `${API_ENDPOINTS.users}/${encodeURIComponent(userId)}/role`;
    const res = await authFetch(url, {
      method: "PUT",
      body: JSON.stringify({ roleId })
    });
    const data = await res.json();
    return data;
  } catch (error) {
    throw error;
  }
}
```

**After:**
```typescript
export async function assignUserRole(userId: string, roleId: string): Promise<User> {
  try {
    const url = `${API_ENDPOINTS.users}/${encodeURIComponent(userId)}/role`;
    const res = await authFetch(url, {
      method: "PUT",
      body: JSON.stringify({ roleId })
    });
    
    // Check if response is OK before parsing
    if (!res.ok) {
      const errorText = await res.text();
      let errorMessage = `Failed to assign role: ${res.status} ${res.statusText}`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData?.message || errorData?.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    
    const data = await res.json();
    return data;
  } catch (error: any) {
    // Re-throw with more context if it's not already an Error
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(error?.message || 'Failed to assign role to user');
  }
}
```

**Improvements:**
- ✅ Checks response status before parsing JSON
- ✅ Extracts meaningful error messages from API responses
- ✅ Provides better error context

## Backend Requirements

The backend endpoint should be:
- **URL**: `PUT /api/ceeone/users/:id/role`
- **Request Body**: `{ "roleId": "uuid-of-role" }`
- **Response**: User object with updated role information

### Expected Response Format:
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "name": "User Name",
  "role": {
    "id": "role-uuid",
    "name": "admin",
    "roleType": "Administrator",
    "permissions": [...]
  }
}
```

## Common Issues and Solutions

### Issue 1: "Failed to assign role: 400 Bad Request"
**Cause**: The `roleId` being sent is not a valid UUID or doesn't exist
**Solution**: 
- Verify the roleId is a valid UUID from the roles list
- Check that the role exists in the backend

### Issue 2: "Failed to assign role: 403 Forbidden"
**Cause**: The current user doesn't have permission to assign roles
**Solution**: 
- Ensure the logged-in user has `users.edit` or `users.update` permission
- Check backend role permissions

### Issue 3: "Failed to assign role: 404 Not Found"
**Cause**: The user ID doesn't exist
**Solution**: 
- Verify the user exists in the system
- Refresh the users list

### Issue 4: Role dropdown shows wrong role after update
**Cause**: UI not refreshing after successful update
**Solution**: 
- The fix now refreshes the users list after update
- This ensures the UI shows the correct role from the backend

## Testing

1. **Test Successful Role Update**:
   - Login as admin
   - Navigate to Users & Roles page
   - Select a different role from the dropdown for a user
   - Should see "User role updated successfully" message
   - User list should refresh showing the new role

2. **Test Error Handling**:
   - Try to update a role with an invalid roleId (if possible)
   - Should see an error message explaining what went wrong
   - UI should revert to the previous role

3. **Test Permission Errors**:
   - Login as a non-admin user
   - Try to update a user's role
   - Should see a 403 Forbidden error message

## Summary

✅ **Fixed**: Error messages now display to users
✅ **Fixed**: Response status is checked before parsing
✅ **Fixed**: User list refreshes after successful update
✅ **Fixed**: UI reverts if update fails

The role update functionality should now work correctly with proper error handling and user feedback.
