/**
 * Security Event Logging
 * RECOMMENDATION #13: Security Hardening & Compliance Framework
 * 
 * Centralized logging for security-related events:
 * - Failed login attempts
 * - Permission violations
 * - Suspicious activity patterns
 * - API key usage
 * - Rate limit violations
 */

import { createClient } from '@/lib/supabase/server';

/**
 * Security event types
 */
export enum SecurityEventType {
  // Authentication events
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  LOGOUT = 'logout',
  SESSION_EXPIRED = 'session_expired',
  
  // Authorization events
  PERMISSION_DENIED = 'permission_denied',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  
  // Data access events
  DATA_EXPORT = 'data_export',
  DATA_DELETION = 'data_deletion',
  SENSITIVE_DATA_ACCESS = 'sensitive_data_access',
  
  // Suspicious activity
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SUSPICIOUS_PATTERN = 'suspicious_pattern',
  BRUTE_FORCE_ATTEMPT = 'brute_force_attempt',
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt',
  XSS_ATTEMPT = 'xss_attempt',
  
  // API events
  API_KEY_CREATED = 'api_key_created',
  API_KEY_REVOKED = 'api_key_revoked',
  API_KEY_USAGE = 'api_key_usage',
  
  // Validation events
  VALIDATION_FAILURE = 'validation_failure',
  CORS_VIOLATION = 'cors_violation',
}

/**
 * Security event severity levels
 */
export enum SecurityEventSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * Security event interface
 */
export interface SecurityEvent {
  type: SecurityEventType;
  severity: SecurityEventSeverity;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  endpoint?: string;
  method?: string;
  message: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

/**
 * Security logger class
 */
class SecurityLogger {
  /**
   * Log a security event
   */
  async log(event: Omit<SecurityEvent, 'timestamp'>): Promise<void> {
    const fullEvent: SecurityEvent = {
      ...event,
      timestamp: new Date(),
    };
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[SECURITY EVENT]', {
        ...fullEvent,
        timestamp: fullEvent.timestamp.toISOString(),
      });
    }
    
    // In production, you would:
    // 1. Send to Sentry/DataDog
    // 2. Store in database for compliance
    // 3. Trigger alerts for critical events
    
    try {
      // Store critical events in database
      if (event.severity === SecurityEventSeverity.CRITICAL || 
          event.severity === SecurityEventSeverity.ERROR) {
        await this.storeEvent(fullEvent);
      }
      
      // Send alerts for critical events
      if (event.severity === SecurityEventSeverity.CRITICAL) {
        await this.sendAlert(fullEvent);
      }
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }
  
  /**
   * Store security event in database
   */
  private async storeEvent(event: SecurityEvent): Promise<void> {
    try {
      const supabase = await createClient();
      
      await supabase.from('security_events').insert({
        event_type: event.type,
        severity: event.severity,
        user_id: event.user_id,
        ip_address: event.ip_address,
        user_agent: event.user_agent,
        endpoint: event.endpoint,
        method: event.method,
        message: event.message,
        metadata: event.metadata,
        created_at: event.timestamp.toISOString(),
      });
    } catch (error) {
      console.error('Failed to store security event:', error);
    }
  }
  
  /**
   * Send alert for critical security events
   */
  private async sendAlert(event: SecurityEvent): Promise<void> {
    // TODO: Implement alert sending (email, Slack, PagerDuty, etc.)
    console.error('[CRITICAL SECURITY EVENT]', event);
  }
  
  /**
   * Log failed login attempt
   */
  async logFailedLogin(
    email: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    await this.log({
      type: SecurityEventType.LOGIN_FAILURE,
      severity: SecurityEventSeverity.WARNING,
      ip_address: ipAddress,
      user_agent: userAgent,
      message: `Failed login attempt for email: ${email}`,
      metadata: { email },
    });
  }
  
  /**
   * Log successful login
   */
  async logSuccessfulLogin(
    userId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    await this.log({
      type: SecurityEventType.LOGIN_SUCCESS,
      severity: SecurityEventSeverity.INFO,
      user_id: userId,
      ip_address: ipAddress,
      user_agent: userAgent,
      message: 'User logged in successfully',
    });
  }
  
  /**
   * Log permission denied
   */
  async logPermissionDenied(
    userId: string | undefined,
    endpoint: string,
    method: string,
    ipAddress: string,
    reason?: string
  ): Promise<void> {
    await this.log({
      type: SecurityEventType.PERMISSION_DENIED,
      severity: SecurityEventSeverity.WARNING,
      user_id: userId,
      ip_address: ipAddress,
      endpoint,
      method,
      message: `Permission denied: ${reason || 'Unauthorized access attempt'}`,
      metadata: { reason },
    });
  }
  
  /**
   * Log rate limit exceeded
   */
  async logRateLimitExceeded(
    userId: string | undefined,
    endpoint: string,
    ipAddress: string,
    limit: number
  ): Promise<void> {
    await this.log({
      type: SecurityEventType.RATE_LIMIT_EXCEEDED,
      severity: SecurityEventSeverity.WARNING,
      user_id: userId,
      ip_address: ipAddress,
      endpoint,
      message: `Rate limit exceeded (${limit} requests)`,
      metadata: { limit },
    });
  }
  
  /**
   * Log suspicious activity
   */
  async logSuspiciousActivity(
    pattern: string,
    ipAddress: string,
    userAgent: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    await this.log({
      type: SecurityEventType.SUSPICIOUS_PATTERN,
      severity: SecurityEventSeverity.ERROR,
      ip_address: ipAddress,
      user_agent: userAgent,
      message: `Suspicious activity detected: ${pattern}`,
      metadata: details,
    });
  }
  
  /**
   * Log validation failure
   */
  async logValidationFailure(
    endpoint: string,
    method: string,
    errors: Array<{ field: string; message: string }>,
    ipAddress: string
  ): Promise<void> {
    await this.log({
      type: SecurityEventType.VALIDATION_FAILURE,
      severity: SecurityEventSeverity.INFO,
      ip_address: ipAddress,
      endpoint,
      method,
      message: 'Request validation failed',
      metadata: { errors },
    });
  }
  
  /**
   * Log CORS violation
   */
  async logCorsViolation(
    origin: string,
    endpoint: string,
    ipAddress: string
  ): Promise<void> {
    await this.log({
      type: SecurityEventType.CORS_VIOLATION,
      severity: SecurityEventSeverity.WARNING,
      ip_address: ipAddress,
      endpoint,
      message: `CORS violation from origin: ${origin}`,
      metadata: { origin },
    });
  }
  
  /**
   * Log data export (GDPR compliance)
   */
  async logDataExport(
    userId: string,
    ipAddress: string,
    dataType: string
  ): Promise<void> {
    await this.log({
      type: SecurityEventType.DATA_EXPORT,
      severity: SecurityEventSeverity.INFO,
      user_id: userId,
      ip_address: ipAddress,
      message: `User exported ${dataType} data`,
      metadata: { dataType },
    });
  }
  
  /**
   * Log data deletion (GDPR compliance)
   */
  async logDataDeletion(
    userId: string,
    ipAddress: string,
    dataType: string
  ): Promise<void> {
    await this.log({
      type: SecurityEventType.DATA_DELETION,
      severity: SecurityEventSeverity.WARNING,
      user_id: userId,
      ip_address: ipAddress,
      message: `User deleted ${dataType} data`,
      metadata: { dataType },
    });
  }
  
  /**
   * Detect brute force attempts
   */
  async detectBruteForce(
    identifier: string,
    ipAddress: string,
    timeWindow: number = 300000 // 5 minutes
  ): Promise<boolean> {
    // This is a simplified implementation
    // In production, use Redis or similar for distributed rate limiting
    
    // TODO: Implement proper brute force detection
    // Check number of failed attempts in time window
    // If threshold exceeded, log and return true
    
    return false;
  }
}

// Export singleton instance
export const securityLogger = new SecurityLogger();

/**
 * Helper to extract security context from request
 */
export function getSecurityContext(request: Request) {
  return {
    ipAddress: 
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    origin: request.headers.get('origin') || undefined,
  };
}
