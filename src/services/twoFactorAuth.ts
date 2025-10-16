import { API_ENDPOINTS, API_BASE_URL } from "../config/api";
import { authFetch } from "./authFetch";

// 2FA Types
export interface TwoFactorSetupResponse {
  qrCode: string;
  secret: string;
  backupCodes: string[];
  message: string;
}

export interface TwoFactorStatusResponse {
  isEnabled: boolean;
  hasBackupCodes: boolean;
  unusedBackupCodes: number;
  message: string;
}

export interface TwoFactorVerifySetupRequest {
  token: string;
  password: string;
}

export interface TwoFactorVerifySetupResponse {
  success: boolean;
  backupCodes: string[];
  message: string;
}

export interface TwoFactorDisableRequest {
  password: string;
  token: string;
}

export interface TwoFactorDisableResponse {
  success: boolean;
  message: string;
}

export interface BackupCodesResponse {
  backupCodes: string[];
  message: string;
}

export interface RegenerateBackupCodesRequest {
  password: string;
}

export interface RegenerateBackupCodesResponse {
  backupCodes: string[];
  message: string;
}

// 2FA Service
export class TwoFactorAuthService {
  /**
   * Setup 2FA - Get QR code and initial backup codes
   */
  static async setup(password: string): Promise<TwoFactorSetupResponse> {
    try {
      const response = await authFetch(`${API_BASE_URL}/auth/2fa/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to setup 2FA');
      }

      return await response.json();
    } catch (error) {
      console.error('Error setting up 2FA:', error);
      throw error;
    }
  }

  /**
   * Verify 2FA setup with token
   */
  static async verifySetup(token: string, password: string): Promise<TwoFactorVerifySetupResponse> {
    try {
      const response = await authFetch(`${API_BASE_URL}/auth/2fa/verify-setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to verify 2FA setup');
      }

      return await response.json();
    } catch (error) {
      console.error('Error verifying 2FA setup:', error);
      throw error;
    }
  }

  /**
   * Get 2FA status
   */
  static async getStatus(): Promise<TwoFactorStatusResponse> {
    try {
      const response = await authFetch(`${API_BASE_URL}/auth/2fa/status`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get 2FA status');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting 2FA status:', error);
      throw error;
    }
  }

  /**
   * Disable 2FA
   */
  static async disable(password: string, token: string): Promise<TwoFactorDisableResponse> {
    try {
      const response = await authFetch(`${API_BASE_URL}/auth/2fa/disable`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password, token }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to disable 2FA');
      }

      return await response.json();
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      throw error;
    }
  }

  /**
   * Get backup codes
   */
  static async getBackupCodes(): Promise<BackupCodesResponse> {
    try {
      const response = await authFetch(`${API_BASE_URL}/auth/2fa/backup-codes`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get backup codes');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting backup codes:', error);
      throw error;
    }
  }

  /**
   * Regenerate backup codes
   */
  static async regenerateBackupCodes(password: string): Promise<RegenerateBackupCodesResponse> {
    try {
      const response = await authFetch(`${API_BASE_URL}/auth/2fa/backup-codes/regenerate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to regenerate backup codes');
      }

      return await response.json();
    } catch (error) {
      console.error('Error regenerating backup codes:', error);
      throw error;
    }
  }
}

// Export individual functions for convenience
export const {
  setup: setupTwoFactor,
  verifySetup: verifyTwoFactorSetup,
  getStatus: getTwoFactorStatus,
  disable: disableTwoFactor,
  getBackupCodes: getTwoFactorBackupCodes,
  regenerateBackupCodes: regenerateTwoFactorBackupCodes
} = TwoFactorAuthService;
