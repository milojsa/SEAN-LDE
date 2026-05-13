/**
 * Undo/Redo State Management Model
 * Maintains history with configurable depth (default 10)
 */

export interface HistoryState {
  layoutId: string;
  timestamp: Date;
  action: string;
  data: any; // serialized layout state
}

export interface UndoRedoManager {
  undo(): void;
  redo(): void;
  pushState(action: string, data: any): void;
  canUndo(): boolean;
  canRedo(): boolean;
  getHistory(): HistoryState[];
  clearHistory(): void;
}

export class UndoRedoStack implements UndoRedoManager {
  private history: HistoryState[] = [];
  private currentIndex: number = -1;
  private maxDepth: number;
  private layoutId: string;

  constructor(layoutId: string, maxDepth: number = 10) {
    this.layoutId = layoutId;
    this.maxDepth = maxDepth;
  }

  pushState(action: string, data: any): void {
    // Remove any redo history
    this.history = this.history.slice(0, this.currentIndex + 1);

    // Add new state
    this.history.push({
      layoutId: this.layoutId,
      timestamp: new Date(),
      action,
      data,
    });

    this.currentIndex++;

    // Trim if over max depth
    if (this.history.length > this.maxDepth) {
      this.history.shift();
      this.currentIndex--;
    }
  }

  undo(): void {
    if (this.canUndo()) {
      this.currentIndex--;
    }
  }

  redo(): void {
    if (this.canRedo()) {
      this.currentIndex++;
    }
  }

  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  getHistory(): HistoryState[] {
    return this.history;
  }

  clearHistory(): void {
    this.history = [];
    this.currentIndex = -1;
  }
}
