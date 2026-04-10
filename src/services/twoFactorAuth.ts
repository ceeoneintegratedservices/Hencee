// Two-factor authentication is handled by Clerk, not a legacy REST API.
// These stubs keep call sites compiling; prefer Clerk user/security settings in the UI.

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

const CLERK_2FA =
  "Two-factor authentication is managed in Clerk (user profile / security). " +
  "Configure MFA in the Clerk Dashboard or your account security settings.";

export class TwoFactorAuthService {
  static async setup(_password: string): Promise<TwoFactorSetupResponse> {
    throw new Error(CLERK_2FA);
  }

  static async verifySetup(
    _token: string,
    _password: string
  ): Promise<TwoFactorVerifySetupResponse> {
    throw new Error(CLERK_2FA);
  }

  static async getStatus(): Promise<TwoFactorStatusResponse> {
    return {
      isEnabled: false,
      hasBackupCodes: false,
      unusedBackupCodes: 0,
      message: CLERK_2FA,
    };
  }

  static async disable(
    _password: string,
    _token: string
  ): Promise<TwoFactorDisableResponse> {
    throw new Error(CLERK_2FA);
  }

  static async getBackupCodes(): Promise<BackupCodesResponse> {
    throw new Error(CLERK_2FA);
  }

  static async regenerateBackupCodes(
    _password: string
  ): Promise<RegenerateBackupCodesResponse> {
    throw new Error(CLERK_2FA);
  }
}

export const {
  setup: setupTwoFactor,
  verifySetup: verifyTwoFactorSetup,
  getStatus: getTwoFactorStatus,
  disable: disableTwoFactor,
  getBackupCodes: getTwoFactorBackupCodes,
  regenerateBackupCodes: regenerateTwoFactorBackupCodes,
} = TwoFactorAuthService;
