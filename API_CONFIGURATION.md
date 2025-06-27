# API Configuration

This project uses environment variables to configure the API base URL for the CeeOne ERP system.

## Setup

1. **Environment File**: The project uses `.env.local` for local development
2. **Configuration**: The base URL is configured in `src/config/api.ts`

## Configuration

### Production (Default)
The project is configured to use the CeeOne ERP API hosted on Render:
```
NEXT_PUBLIC_API_BASE_URL=https://ceeone-api.onrender.com
```

### Local Development
If you want to use a local backend, create a `.env.local` file in the root directory with:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

## API Endpoints

Based on the [CeeOne ERP API](https://ceeone-api.onrender.com/), the following endpoints are configured in `src/config/api.ts`:

### Authentication
- **Register**: `${API_BASE_URL}/auth/register`
- **Login**: `${API_BASE_URL}/auth/login`
- **Password Reset**: `${API_BASE_URL}/auth/password-reset`
- **Password Reset Confirm**: `${API_BASE_URL}/auth/password-reset-confirm`
- **Resend Verification**: `${API_BASE_URL}/auth/resend-verification`
- **Verify Email**: `${API_BASE_URL}/auth/verify-email`

### Core Modules
- **Products**: `${API_BASE_URL}/products`
- **Customers**: `${API_BASE_URL}/customers`
- **Sales**: `${API_BASE_URL}/sales`
- **Payments**: `${API_BASE_URL}/payments`

### Documentation
- **API Docs**: `${API_BASE_URL}/api`

## Usage

Import the API configuration in your components:
```typescript
import { API_ENDPOINTS } from "../../config/api";

// Use the endpoints
const response = await fetch(API_ENDPOINTS.register, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data)
});

// Email verification example
const verifyResponse = await fetch(API_ENDPOINTS.verifyEmail, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ token: "verification-token" })
});
```

## API Status

The CeeOne ERP API is currently:
- **Status**: Active
- **Version**: 1.0.0
- **Host**: Render
- **Documentation**: Available at `/api` endpoint

## Notes

- The `NEXT_PUBLIC_` prefix is required for client-side access in Next.js
- The default API URL is now set to the production CeeOne ERP API
- Restart your development server after changing environment variables
- Visit [https://ceeone-api.onrender.com/api](https://ceeone-api.onrender.com/api) for detailed API documentation 