/**
 * Models index - Export all data models and factories
 */

export { createEmptyLayout, createTextElement, createImageElement } from './layout';
export type {
  LayoutDocument,
  LayoutElement,
  Page,
  PageDimensions,
  PageMargins,
  TextElementProperties,
  ImageElementProperties,
  ShapeElementProperties,
} from './layout';

export { UndoRedoStack } from './history';
export type { HistoryState, UndoRedoManager } from './history';
