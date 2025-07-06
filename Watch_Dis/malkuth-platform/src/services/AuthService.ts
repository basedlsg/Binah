import { NextRequest } from 'next/server';

export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'user' | 'bot';
  permissions: string[];
  isActive: boolean;
}

export interface AuthToken {
  userId: string;
  role: string;
  permissions: string[];
  exp: number;
  iat: number;
}

export class AuthService {
  private static instance: AuthService;
  private readonly jwtSecret: string;

  private constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'default-secret-key';
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Authenticate API request
   */
  public async authenticateRequest(request: NextRequest): Promise<AuthUser | null> {
    try {
      const token = this.extractToken(request);
      if (!token) {
        return null;
      }

      const decoded = await this.verifyToken(token);
      if (!decoded) {
        return null;
      }

      // Get user details (in production, this would query a database)
      const user = await this.getUserById(decoded.userId);
      return user;
    } catch (error) {
      console.error('Authentication failed:', error);
      return null;
    }
  }

  /**
   * Check if user has required permission
   */
  public hasPermission(user: AuthUser, permission: string): boolean {
    if (user.role === 'admin') {
      return true; // Admins have all permissions
    }

    return user.permissions.includes(permission);
  }

  /**
   * Generate API key for service-to-service communication
   */
  public async generateAPIKey(userId: string, permissions: string[] = []): Promise<string> {
    const payload = {
      userId,
      type: 'api_key',
      permissions,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 year
    };

    return this.signToken(payload);
  }

  /**
   * Validate system health check access
   */
  public validateHealthCheckAccess(request: NextRequest): boolean {
    // Allow health checks from localhost or with special header
    const origin = request.headers.get('origin');
    const healthKey = request.headers.get('x-health-key');
    
    if (origin?.includes('localhost') || origin?.includes('127.0.0.1')) {
      return true;
    }

    if (healthKey === process.env.HEALTH_CHECK_KEY) {
      return true;
    }

    return false;
  }

  /**
   * Rate limiting check
   */
  public async checkRateLimit(userId: string, action: string): Promise<boolean> {
    // Simplified rate limiting (in production, use Redis)
    const key = `${userId}:${action}`;
    // Implementation would check Redis or database
    return true; // Allow for now
  }

  /**
   * Extract token from request
   */
  private extractToken(request: NextRequest): string | null {
    const authHeader = request.headers.get('authorization');
    
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Check for API key in query params (for webhooks, etc.)
    const apiKey = request.nextUrl.searchParams.get('api_key');
    if (apiKey) {
      return apiKey;
    }

    // Check for session token in cookies
    const sessionToken = request.cookies.get('session_token')?.value;
    if (sessionToken) {
      return sessionToken;
    }

    return null;
  }

  /**
   * Verify JWT token
   */
  private async verifyToken(token: string): Promise<AuthToken | null> {
    try {
      // Simple JWT verification (in production, use a proper JWT library)
      const payload = this.decodeToken(token);
      
      if (!payload || payload.exp < Math.floor(Date.now() / 1000)) {
        return null; // Token expired
      }

      return payload;
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }

  /**
   * Get user by ID
   */
  private async getUserById(userId: string): Promise<AuthUser | null> {
    // Mock user data (in production, query database)
    const mockUsers: Record<string, AuthUser> = {
      'admin-1': {
        id: 'admin-1',
        email: 'admin@malkuth-platform.com',
        role: 'admin',
        permissions: ['*'],
        isActive: true
      },
      'user-1': {
        id: 'user-1',
        email: 'user@example.com',
        role: 'user',
        permissions: ['read', 'write', 'create_content', 'manage_bots'],
        isActive: true
      },
      'system': {
        id: 'system',
        email: 'system@malkuth-platform.com',
        role: 'admin',
        permissions: ['*'],
        isActive: true
      }
    };

    return mockUsers[userId] || null;
  }

  /**
   * Sign token (simplified - use proper JWT library in production)
   */
  private signToken(payload: any): string {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    
    // In production, use proper HMAC signing
    const signature = Buffer.from(`${encodedHeader}.${encodedPayload}.${this.jwtSecret}`).toString('base64url');
    
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Decode token (simplified - use proper JWT library in production)
   */
  private decodeToken(token: string): AuthToken | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      return payload as AuthToken;
    } catch (error) {
      return null;
    }
  }
}

/**
 * Authorization decorator for API routes
 */
export function requireAuth(permissions: string[] = []) {
  return function(target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function(request: NextRequest, ...args: any[]) {
      const authService = AuthService.getInstance();
      const user = await authService.authenticateRequest(request);
      
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized', message: 'Authentication required' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (!user.isActive) {
        return new Response(
          JSON.stringify({ error: 'Forbidden', message: 'Account is inactive' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Check permissions
      if (permissions.length > 0) {
        const hasRequiredPermission = permissions.some(permission => 
          authService.hasPermission(user, permission)
        );

        if (!hasRequiredPermission) {
          return new Response(
            JSON.stringify({ 
              error: 'Forbidden', 
              message: 'Insufficient permissions',
              required: permissions 
            }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }

      // Add user to request context
      (request as any).user = user;
      
      return method.apply(this, [request, ...args]);
    };
  };
}

export const authService = AuthService.getInstance();