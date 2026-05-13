/**
 * Storage Adapter - Defines interface for persisting layouts
 * The main FWScomments app will implement this to use its MongoDB
 * During MS2 standalone, uses mock or local MongoDB
 */

export interface LayoutDocument {
  _id?: string;
  projectId: string;
  pageId: string;
  ownerId: string;
  title: string;
  width: number;
  height: number;
  elements: LayoutElement[];
  version: number;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface LayoutElement {
  id: string;
  type: 'text' | 'image' | 'shape' | 'container';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  locked: boolean;
  opacity: number;
  properties: Record<string, any>;
}

export interface StorageAdapter {
  /**
   * Save or update a layout document
   * Atomicity: Either fully saves or throws
   * Returns the saved document with _id
   */
  saveLayout(document: LayoutDocument): Promise<LayoutDocument>;

  /**
   * Load a layout document by ID
   * Throws if document not found or access denied
   */
  loadLayout(layoutId: string): Promise<LayoutDocument>;

  /**
   * Delete a layout document
   * Throws if document not found or access denied
   */
  deleteLayout(layoutId: string): Promise<void>;

  /**
   * List all layouts for a project
   * Respects ownership - returns only layouts the user owns
   */
  listLayouts(projectId: string): Promise<LayoutDocument[]>;

  /**
   * Check if current user owns the layout
   * Used before allowing edit operations
   */
  checkOwnership(layoutId: string): Promise<boolean>;
}

/**
 * Mock storage adapter for standalone MS2 development
 */
export class MockStorageAdapter implements StorageAdapter {
  private layouts: Map<string, LayoutDocument> = new Map();
  private currentUserId: string = 'mock-user-001';

  async saveLayout(document: LayoutDocument): Promise<LayoutDocument> {
    const id = document._id || `layout-${Date.now()}`;
    const saved: LayoutDocument = {
      ...document,
      _id: id,
      updatedAt: new Date(),
    };
    this.layouts.set(id, saved);
    return saved;
  }

  async loadLayout(layoutId: string): Promise<LayoutDocument> {
    const layout = this.layouts.get(layoutId);
    if (!layout) throw new Error(`Layout ${layoutId} not found`);
    return layout;
  }

  async deleteLayout(layoutId: string): Promise<void> {
    this.layouts.delete(layoutId);
  }

  async listLayouts(projectId: string): Promise<LayoutDocument[]> {
    return Array.from(this.layouts.values()).filter(
      (l) => l.projectId === projectId && l.ownerId === this.currentUserId
    );
  }

  async checkOwnership(layoutId: string): Promise<boolean> {
    const layout = this.layouts.get(layoutId);
    return layout?.ownerId === this.currentUserId;
  }
}
