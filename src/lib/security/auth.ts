/**
 * Authentication Security Utilities
 * RECOMMENDATION #13: Security Hardening & Compliance Framework
 * 
 * Enhanced authentication features:
 * - Session timeout management
 * - Secure cookie settings
 * - MFA preparation
 * - Password strength validation
 */

import { createClient } from '@/lib/supabase/server';
import { securityLogger, SecurityEventSeverity, SecurityEventType } from './logger';

/**
 * Session configuration
 */
export const SESSION_CONFIG = {
  // Session timeout (1 hour)
  timeout: 3600000, // 1 hour in milliseconds
  
  // Absolute session timeout (12 hours)
  absoluteTimeout: 43200000, // 12 hours in milliseconds
  
  // Cookie settings
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  },
};

/**
 * Password strength requirements
 */
export const PASSWORD_REQUIREMENTS = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  maxLength: 128,
};

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
} {
  const errors: string[] = [];
  
  // Length check
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`);
  }
  
  if (password.length > PASSWORD_REQUIREMENTS.maxLength) {
    errors.push(`Password must not exceed ${PASSWORD_REQUIREMENTS.maxLength} characters`);
  }
  
  // Uppercase check
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  // Lowercase check
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  // Number check
  if (PASSWORD_REQUIREMENTS.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  // Special character check
  if (PASSWORD_REQUIREMENTS.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Calculate strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  
  if (errors.length === 0) {
    const hasAllTypes = 
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password) &&
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    if (password.length >= 16 && hasAllTypes) {
      strength = 'strong';
    } else if (password.length >= PASSWORD_REQUIREMENTS.minLength) {
      strength = 'medium';
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    strength,
  };
}

/**
 * Check if session has timed out
 */
export async function checkSessionTimeout(
  lastActivity: Date
): Promise<boolean> {
  const now = new Date().getTime();
  const lastActivityTime = lastActivity.getTime();
  const timeSinceActivity = now - lastActivityTime;
  
  return timeSinceActivity > SESSION_CONFIG.timeout;
}

/**
 * Refresh session activity timestamp
 */
export async function refreshSessionActivity(userId: string): Promise<void> {
  const supabase = await createClient();
  
  try {
    await supabase
      .from('user_sessions')
      .update({
        last_activity: new Date().toISOString(),
      })
      .eq('user_id', userId);
  } catch (error) {
    console.error('Failed to refresh session activity:', error);
  }
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check for common weak passwords
 */
const COMMON_PASSWORDS = [
  'password',
  '12345678',
  'qwerty123',
  'password123',
  'admin123',
  'welcome123',
];

export function isCommonPassword(password: string): boolean {
  return COMMON_PASSWORDS.some(weak => 
    password.toLowerCase().includes(weak)
  );
}

/**
 * Generate secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    token += chars[randomIndex];
  }
  
  return token;
}

/**
 * Authentication helper to track login attempts
 */
export class AuthenticationMonitor {
  private static loginAttempts = new Map<string, number>();
  private static lockouts = new Map<string, Date>();
  
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION = 900000; // 15 minutes
  
  /**
   * Record a failed login attempt
   */
  static async recordFailedAttempt(
    identifier: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    const attempts = (this.loginAttempts.get(identifier) || 0) + 1;
    this.loginAttempts.set(identifier, attempts);
    
    await securityLogger.log({
      type: SecurityEventType.LOGIN_FAILURE,
      severity: SecurityEventSeverity.WARNING,
      ip_address: ipAddress,
      user_agent: userAgent,
      message: `Failed login attempt ${attempts}/${this.MAX_ATTEMPTS} for ${identifier}`,
      metadata: { identifier, attempts },
    });
    
    // Lock account if max attempts reached
    if (attempts >= this.MAX_ATTEMPTS) {
      this.lockouts.set(identifier, new Date());
      
      await securityLogger.log({
        type: SecurityEventType.BRUTE_FORCE_ATTEMPT,
        severity: SecurityEventSeverity.CRITICAL,
        ip_address: ipAddress,
        user_agent: userAgent,
        message: `Account locked due to ${attempts} failed login attempts for ${identifier}`,
        metadata: { identifier, attempts },
      });
    }
  }
  
  /**
   * Check if account is locked
   */
  static isLocked(identifier: string): boolean {
    const lockoutTime = this.lockouts.get(identifier);
    
    if (!lockoutTime) {
      return false;
    }
    
    const now = new Date().getTime();
    const lockoutEnd = lockoutTime.getTime() + this.LOCKOUT_DURATION;
    
    if (now > lockoutEnd) {
      // Lockout expired
      this.lockouts.delete(identifier);
      this.loginAttempts.delete(identifier);
      return false;
    }
    
    return true;
  }
  
  /**
   * Reset login attempts after successful login
   */
  static resetAttempts(identifier: string): void {
    this.loginAttempts.delete(identifier);
    this.lockouts.delete(identifier);
  }
  
  /**
   * Get remaining lockout time
   */
  static getRemainingLockoutTime(identifier: string): number {
    const lockoutTime = this.lockouts.get(identifier);
    
    if (!lockoutTime) {
      return 0;
    }
    
    const now = new Date().getTime();
    const lockoutEnd = lockoutTime.getTime() + this.LOCKOUT_DURATION;
    const remaining = lockoutEnd - now;
    
    return Math.max(0, remaining);
  }
}

/**
 * MFA (Multi-Factor Authentication) utilities
 * 
 * Note: Full MFA implementation requires Supabase Auth configuration
 * These are helper functions to prepare for MFA support
 */
export const MFA = {
  /**
   * Check if user has MFA enabled
   */
  async isEnabled(userId: string): Promise<boolean> {
    const supabase = await createClient();
    
    try {
      const { data } = await supabase
        .from('profiles')
        .select('mfa_enabled')
        .eq('id', userId)
        .single();
      
      return data?.mfa_enabled || false;
    } catch {
      return false;
    }
  },
  
  /**
   * Placeholder for MFA setup
   * TODO: Implement with Supabase Auth MFA
   */
  async setup(userId: string): Promise<{ qrCode: string; secret: string }> {
    // This would integrate with Supabase Auth MFA
    throw new Error('MFA setup not yet implemented - requires Supabase Auth configuration');
  },
  
  /**
   * Placeholder for MFA verification
   * TODO: Implement with Supabase Auth MFA
   */
  async verify(userId: string, code: string): Promise<boolean> {
    // This would verify TOTP code with Supabase Auth
    throw new Error('MFA verification not yet implemented - requires Supabase Auth configuration');
  },
};
