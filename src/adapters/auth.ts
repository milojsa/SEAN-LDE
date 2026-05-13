/**
 * Auth Adapter - Defines interface for user context and permissions
 * The main FWScomments app will implement this to use its NextAuth session
 * During MS2 standalone, uses mock auth
 */

export interface UserContext {
  userId: string;
  email: string;
  name?: string;
  projectId: string;
  requestId?: string;
  role: 'owner' | 'editor' | 'viewer';
}

export interface AuthAdapter {
  /**
   * Get current user context
   * Should throw if user is not authenticated
   */
  getCurrentUser(): Promise<UserContext>;

  /**
   * Get project and request context if available
   * Used to load associated images, texts, and metadata
   */
  getProjectContext(): Promise<{
    projectId: string;
    requestId?: string;
  } | null>;

  /**
   * Check if user has permission for specific action
   * Actions: 'read' | 'write' | 'delete' | 'export'
   */
  checkPermission(action: string): Promise<boolean>;

  /**
   * Emit audit log event
   * Used to track editor usage and modifications
   */
  logAction(action: string, metadata?: Record<string, any>): Promise<void>;
}

/**
 * Mock auth adapter for standalone MS2 development
 */
export class MockAuthAdapter implements AuthAdapter {
  private user: UserContext = {
    userId: 'mock-user-001',
    email: 'dev@lde-editor.local',
    name: 'LDE Developer',
    projectId: 'mock-project-001',
    role: 'owner',
  };

  async getCurrentUser(): Promise<UserContext> {
    return this.user;
  }

  async getProjectContext(): Promise<{
    projectId: string;
    requestId?: string;
  } | null> {
    return {
      projectId: this.user.projectId,
      requestId: 'mock-request-001',
    };
  }

  async checkPermission(action: string): Promise<boolean> {
    // Mock: owner has all permissions
    return true;
  }

  async logAction(action: string, metadata?: Record<string, any>): Promise<void> {
    console.log(`[AUDIT] User ${this.user.userId}: ${action}`, metadata);
  }
}
