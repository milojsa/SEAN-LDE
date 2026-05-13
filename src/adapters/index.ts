/**
 * Editor Adapters - Main index file
 * Exports all adapter interfaces and mock implementations
 */

import type { StorageAdapter } from './storage';
import { MockStorageAdapter } from './storage';
import type { AuthAdapter } from './auth';
import { MockAuthAdapter } from './auth';
import type { GalleryAdapter } from './gallery';
import { MockGalleryAdapter } from './gallery';
import type { ExportAdapter } from './export';
import { MockExportAdapter } from './export';

export { MockStorageAdapter } from './storage';
export type {
  StorageAdapter,
  LayoutDocument as StorageLayoutDocument,
  LayoutElement as StorageLayoutElement,
} from './storage';

export { MockAuthAdapter } from './auth';
export type { AuthAdapter, UserContext } from './auth';

export { MockGalleryAdapter } from './gallery';
export type { GalleryAdapter, ProjectAsset } from './gallery';

export { MockExportAdapter } from './export';
export type { ExportAdapter, ExportOptions, ExportResult } from './export';

/**
 * Complete adapter set for editor initialization
 * Main app will implement all these interfaces
 * For standalone MS2, use MockAdapters
 */
export interface EditorAdapters {
  storage: StorageAdapter;
  auth: AuthAdapter;
  gallery: GalleryAdapter;
  export: ExportAdapter;
}

/**
 * Factory function for creating mock adapters (standalone development)
 */
export function createMockAdapters(): EditorAdapters {
  return {
    storage: new MockStorageAdapter(),
    auth: new MockAuthAdapter(),
    gallery: new MockGalleryAdapter(),
    export: new MockExportAdapter(),
  };
}
