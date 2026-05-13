/**
 * LDE Editor Module Main Export
 * 
 * This is the entry point for importing the editor into FWScomments or using it standalone
 */

// Adapters - main integration points
export * from './adapters';

// Models - data structures
export * from './models';

// UI Components - React components for editor
export { EditorComponent } from './ui';

// Core functionality - canvas, tools, undo/redo
export * from './core';

// Export pipelines - PNG, PDF, HTML
export * from './export';

/**
 * Version and compatibility info
 */
export const MODULE_VERSION = '0.1.0';
export const ADAPTER_VERSION = '1.0.0';
export const MIN_NODE_VERSION = '22.16.0';
export const MIN_REACT_VERSION = '18.3.1';

/**
 * Compatibility check helper
 */
export function checkCompatibility(reactVersion: string, nodeVersion: string): boolean {
  // Simplified check - implement full semver comparison in production
  return reactVersion.startsWith('18.3') && nodeVersion.startsWith('22.16');
}
