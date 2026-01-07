# Email Verification Setup Guide

This guide explains how to set up and use the email verification system to prevent login issues.

## Quick Start

### For Backend Developers

1. **Update Create User DTO:**
   ```typescript
   export class CreateUserDto {
     email: string;
     name: string;
     phone: string;
     password: string;
     roleId: string;
     isEmailVerified?: boolean; // Add this field
   }
   ```

2. **Update User Creation Logic:**
   ```typescript
   // In your user creation service
   const user = await this.userRepository.create({
     ...createUserDto,
     isEmailVerified: createUserDto.isEmailVerified ?? false, // Default to false for public signups
   });
   
   // If isEmailVerified is true, skip sending verification email
   if (!createUserDto.isEmailVerified) {
     await this.sendVerificationEmail(user);
   }
   ```

3. **Implement Verify Email Endpoint:**
   ```typescript
   @Post(':id/verify-email')
   @UseGuards(AuthGuard, RolesGuard)
   @Roles('admin', 'manager') // Only admins can verify emails
   async verifyUserEmail(@Param('id') userId: string) {
     await this.userService.verifyEmail(userId);
     return { message: 'Email verified successfully' };
   }
   ```

### For Frontend Developers

The frontend is already configured to auto-verify admin-created users. No additional setup needed.

## Environment Variables (Optional)

If you want to control auto-verification via environment variables, add to your backend `.env`:

```bash
# Auto-verify admin-created users (RECOMMENDED)
AUTO_VERIFY_ADMIN_CREATED_USERS=true
```

Then in your backend code:

```typescript
const shouldAutoVerify = process.env.AUTO_VERIFY_ADMIN_CREATED_USERS === 'true';
const isEmailVerified = createUserDto.isEmailVerified ?? shouldAutoVerify;
```

## Usage Examples

### Creating a User (Frontend)

```typescript
import { createUser } from '@/services/users';

// Admin creates user - auto-verified
await createUser({
  email: 'user@example.com',
  name: 'User Name',
  phone: '1234567890',
  password: 'password123',
  roleId: 'role-uuid',
  isEmailVerified: true // Auto-verify
});
```

### Manually Verifying a User

```typescript
import { verifyUserEmail } from '@/services/users';

// Verify a user's email
await verifyUserEmail(userId);
```

## API Endpoints

### Create User
```
POST /api/ceeone/users
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "User Name",
  "phone": "1234567890",
  "password": "password123",
  "roleId": "role-uuid",
  "isEmailVerified": true  // Optional, defaults to false
}
```

### Verify User Email
```
POST /api/ceeone/users/:id/verify-email
Authorization: Bearer <admin-token>
```

## Common Issues

### Issue: User cannot login after admin creation

**Solution:** Ensure backend accepts and processes `isEmailVerified: true` in the Create User DTO.

### Issue: Verification endpoint returns 404

**Solution:** Ensure backend implements `POST /api/ceeone/users/:id/verify-email` endpoint.

### Issue: Users still receive verification emails

**Solution:** Update backend to skip sending verification emails when `isEmailVerified: true`.

## Best Practices

1. **Always auto-verify admin-created users** - They're internal staff accounts
2. **Never auto-verify public signups** - These need email verification for security
3. **Use manual verification** - For fixing existing unverified accounts
4. **Log verification actions** - Track who verified which users and when

## Migration Guide

### For Existing Unverified Users

If you have existing users who cannot login due to unverified emails:

1. **Option 1: Use the verify endpoint**
   ```typescript
   // Verify specific users
   await verifyUserEmail('user-id-1');
   await verifyUserEmail('user-id-2');
   ```

2. **Option 2: Database migration**
   ```sql
   -- Verify all existing users (use with caution)
   UPDATE users SET is_email_verified = true WHERE created_at < '2024-01-01';
   ```

## Support

For issues or questions:
1. Check `docs/PREVENT_EMAIL_VERIFICATION_ISSUES.md` for detailed prevention mechanisms
2. Review backend logs for verification-related errors
3. Verify API endpoints are correctly implemented

