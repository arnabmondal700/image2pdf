import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { DocumentItem } from '../../../models/document-item.model';
import { DocumentItemCardComponent } from '../document-item-card/document-item-card.component';

/**
 * Component displaying the mixed document queue with virtual scrolling,
 * drag-and-drop reordering, and multi-select support.
 */
@Component({
  selector: 'document-queue',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    ScrollingModule,
    DocumentItemCardComponent
  ],
  template: `
    <div class="queue-container">
      <!-- Batch actions toolbar -->
      @if (selectedCount > 0) {
        <div class="batch-toolbar">
          <span class="selected-count">{{ selectedCount }} selected</span>
          <div class="batch-actions">
            <button
              class="batch-btn rotate-batch"
              (click)="onRotateSelected.emit()"
              title="Rotate selected items"
            >
              ↻ Rotate
            </button>
            <button
              class="batch-btn duplicate-batch"
              (click)="onDuplicateSelected.emit()"
              title="Duplicate selected items"
            >
              ⧉ Duplicate
            </button>
            <button
              class="batch-btn delete-batch"
              (click)="onDeleteSelected.emit()"
              title="Delete selected items"
            >
              ✕ Delete
            </button>
            <button
              class="batch-btn clear-batch"
              (click)="onClearSelection.emit()"
              title="Clear selection"
            >
              Deselect
            </button>
          </div>
        </div>
      }

      <!-- Empty state -->
      @if (items.length === 0) {
        <div class="empty-state">
          <div class="empty-icon">📦</div>
          <p class="empty-title">No items in queue</p>
          <p class="empty-hint">Upload images or PDFs to start building your document</p>
        </div>
      } @else {
        <!-- Drag-drop + virtual scroll list -->
        <div
          class="queue-list"
          cdkDropList
          [cdkDropListData]="items"
          (cdkDropListDropped)="onDrop($event)"
        >
          @if (items.length > 50) {
            <!-- Virtual scroll for large queues -->
            <cdk-virtual-scroll-viewport
              itemSize={96}
              class="virtual-viewport"
            >
              <div
                *cdkVirtualFor="let item of items; let i = index; trackBy: trackByItemId"
                cdkDrag
                [cdkDragData]="item"
              >
                <div class="drag-handle" cdkDragHandle>::</div>
                <document-item-card
                  [item]="item"
                  [index]="i"
                  (onToggleSelect)="onToggleSelect.emit($event)"
                  (onRemove)="onRemoveItem.emit($event)"
                  (onRotate)="onRotateItem.emit($event)"
                  (onDuplicate)="onDuplicateItem.emit($event)"
                ></document-item-card>
              </div>
            </cdk-virtual-scroll-viewport>
          } @else {
            <!-- Regular list for small queues -->
            @for (item of items; track item.id; let i = $index) {
              <div
                cdkDrag
                [cdkDragData]="item"
                class="queue-item-wrapper"
              >
                <div class="drag-handle" cdkDragHandle>::</div>
                <document-item-card
                  [item]="item"
                  [index]="i"
                  (onToggleSelect)="onToggleSelect.emit($event)"
                  (onRemove)="onRemoveItem.emit($event)"
                  (onRotate)="onRotateItem.emit($event)"
                  (onDuplicate)="onDuplicateItem.emit($event)"
                ></document-item-card>
              </div>
            }
          }
        </div>
      }

      <!-- Item count -->
      @if (items.length > 0) {
        <div class="queue-footer">
          <span class="item-count">{{ items.length }} item{{ items.length !== 1 ? 's' : '' }}</span>
          <span class="item-breakdown">
            ({{ imageCount }} image{{ imageCount !== 1 ? 's' : '' }},
            {{ pdfPageCount }} PDF page{{ pdfPageCount !== 1 ? 's' : '' }})
          </span>
        </div>
      }
    </div>
  `,
  styles: [`
    .queue-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .batch-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      background: #e3f2fd;
      border: 1px solid #90caf9;
      border-radius: 8px;
      gap: 12px;
    }

    .selected-count {
      font-size: 13px;
      font-weight: 600;
      color: #1565c0;
      white-space: nowrap;
    }

    .batch-actions {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .batch-btn {
      padding: 4px 10px;
      border: 1px solid #90caf9;
      border-radius: 4px;
      background: #fff;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.15s ease;
      white-space: nowrap;
    }

    .batch-btn:hover {
      background: #f5f5f5;
    }

    .rotate-batch:hover {
      border-color: #ff9800;
      color: #ff9800;
    }

    .duplicate-batch:hover {
      border-color: #4caf50;
      color: #4caf50;
    }

    .delete-batch:hover {
      border-color: #f44336;
      color: #f44336;
    }

    .clear-batch:hover {
      border-color: #666;
      color: #666;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 20px;
      text-align: center;
      border: 2px dashed #e0e0e0;
      border-radius: 12px;
      background: #fafafa;
    }

    .empty-icon {
      font-size: 48px;
      margin-bottom: 12px;
    }

    .empty-title {
      font-size: 16px;
      font-weight: 600;
      color: #666;
      margin: 0 0 4px 0;
    }

    .empty-hint {
      font-size: 13px;
      color: #999;
      margin: 0;
    }

    .queue-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-height: 100px;
    }

    .virtual-viewport {
      height: 500px;
      border: 1px solid #eee;
      border-radius: 8px;
    }

    .queue-item-wrapper {
      position: relative;
    }

    .drag-handle {
      position: absolute;
      left: -20px;
      top: 50%;
      transform: translateY(-50%);
      color: #bbb;
      font-size: 14px;
      cursor: grab;
      user-select: none;
      padding: 4px;
      display: flex;
      align-items: center;
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .queue-item-wrapper:hover .drag-handle,
    .queue-item-wrapper.cdk-drag-preview .drag-handle {
      opacity: 1;
    }

    .drag-handle:hover {
      color: #666;
    }

    .drag-handle:active {
      cursor: grabbing;
    }

    .queue-footer {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      font-size: 12px;
      color: #888;
    }

    .item-count {
      font-weight: 600;
    }

    .item-breakdown {
      color: #aaa;
    }

    /* CDK drag styles */
    .cdk-drag-preview {
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
      border-radius: 8px;
      opacity: 0.9;
    }

    .cdk-drag-placeholder {
      opacity: 0;
    }

    .cdk-drag-animating {
      transition: transform 200ms cubic-bezier(0, 0, 0.2, 1);
    }

    .queue-list.cdk-drop-list-dragging .queue-item-wrapper:not(.cdk-drag-placeholder) {
      transition: transform 200ms cubic-bezier(0, 0, 0.2, 1);
    }
  `]
})
export class DocumentQueueComponent {
  /** All items in the queue */
  @Input({ required: true }) items: DocumentItem[] = [];

  /** Count of image items */
  get imageCount(): number {
    return this.items.filter((i) => i.type === 'image').length;
  }

  /** Count of PDF page items */
  get pdfPageCount(): number {
    return this.items.filter((i) => i.type === 'pdf-page').length;
  }

  /** Count of selected items */
  get selectedCount(): number {
    return this.items.filter((i) => i.selected).length;
  }

  /** Emitted when items are reordered via drag-drop */
  @Output() onReordered = new EventEmitter<{ fromIndex: number; toIndex: number }>();

  /** Emitted when user toggles selection of an item */
  @Output() onToggleSelect = new EventEmitter<number>();

  /** Emitted when user removes a single item */
  @Output() onRemoveItem = new EventEmitter<number>();

  /** Emitted when user rotates a single item */
  @Output() onRotateItem = new EventEmitter<number>();

  /** Emitted when user duplicates a single item */
  @Output() onDuplicateItem = new EventEmitter<number>();

  /** Emitted when user requests batch rotate */
  @Output() onRotateSelected = new EventEmitter<void>();

  /** Emitted when user requests batch duplicate */
  @Output() onDuplicateSelected = new EventEmitter<void>();

  /** Emitted when user requests batch delete */
  @Output() onDeleteSelected = new EventEmitter<void>();

  /** Emitted when user clears selection */
  @Output() onClearSelection = new EventEmitter<void>();

  /**
   * Handle drag-drop reorder
   */
  onDrop(event: CdkDragDrop<DocumentItem[]>): void {
    if (event.previousIndex !== event.currentIndex) {
      this.onReordered.emit({
        fromIndex: event.previousIndex,
        toIndex: event.currentIndex,
      });
    }
  }

  /**
   * Track items by their unique ID for optimal rendering
   */
  trackByItemId(_index: number, item: DocumentItem): string {
    return item.id;
  }
}