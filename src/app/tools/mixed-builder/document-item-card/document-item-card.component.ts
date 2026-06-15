import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentItem } from '../../../models/document-item.model';

/**
 * Component for displaying a single document queue item.
 * Shows thumbnail, filename, type indicator, rotation state,
 * and provides action buttons.
 */
@Component({
  selector: 'document-item-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="document-item-card"
      [class.selected]="item.selected"
      [class.image-type]="item.type === 'image'"
      [class.pdf-type]="item.type === 'pdf-page'"
      (click)="onToggleSelect.emit(index)"
      (keydown.enter)="onToggleSelect.emit(index)"
      (keydown.space)="onToggleSelect.emit(index); $event.preventDefault()"
      tabindex="0"
      role="listitem"
      [attr.aria-selected]="item.selected"
    >
      <!-- Thumbnail -->
      <div class="item-thumbnail">
        @if (item.thumbnail) {
          <img [src]="item.thumbnail" [alt]="item.name" loading="lazy" />
        } @else {
          <div class="thumbnail-placeholder">
            @if (item.type === 'image') {
              <span class="placeholder-icon">🖼️</span>
            } @else {
              <span class="placeholder-icon">📄</span>
            }
          </div>
        }
        @if (item.type === 'pdf-page' && item.pdfPageIndex !== undefined) {
          <span class="page-badge">P{{ item.pdfPageIndex + 1 }}</span>
        }
      </div>

      <!-- Item details -->
      <div class="item-details">
        <span class="item-name" [title]="item.name">{{ item.name }}</span>
        <div class="item-meta">
          @if (item.type === 'image') {
            <span class="type-badge image-badge">Image</span>
          } @else {
            <span class="type-badge pdf-badge">PDF</span>
          }
          @if (item.rotation && item.rotation > 0) {
            <span class="rotation-badge">{{ item.rotation }}°</span>
          }
        </div>
      </div>

      <!-- Actions -->
      <div class="item-actions" (click)="$event.stopPropagation()">
        <button
          class="action-btn rotate-btn"
          title="Rotate 90°"
          (click)="onRotate.emit(index)"
          aria-label="Rotate item"
        >
          ↻
        </button>
        <button
          class="action-btn duplicate-btn"
          title="Duplicate"
          (click)="onDuplicate.emit(index)"
          aria-label="Duplicate item"
        >
          ⧉
        </button>
        <button
          class="action-btn remove-btn"
          title="Remove"
          (click)="onRemove.emit(index)"
          aria-label="Remove item"
        >
          ✕
        </button>
      </div>

      <!-- Selection checkbox -->
      <div class="selection-indicator" (click)="$event.stopPropagation()">
        <input
          type="checkbox"
          [checked]="item.selected"
          (change)="onToggleSelect.emit(index)"
          aria-label="Select item"
          class="selection-checkbox"
        />
      </div>
    </div>
  `,
  styles: [`
    .document-item-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      background: #ffffff;
      transition: all 0.2s ease;
      cursor: pointer;
      position: relative;
      user-select: none;
    }

    .document-item-card:hover {
      border-color: #1976d2;
      background: #f5f8ff;
    }

    .document-item-card.selected {
      border-color: #1976d2;
      background: #e3f2fd;
      box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
    }

    .item-thumbnail {
      width: 60px;
      height: 75px;
      flex-shrink: 0;
      border-radius: 4px;
      overflow: hidden;
      background: #f5f5f5;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      border: 1px solid #eee;
    }

    .item-thumbnail img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .thumbnail-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
    }

    .placeholder-icon {
      font-size: 24px;
      opacity: 0.5;
    }

    .page-badge {
      position: absolute;
      bottom: 2px;
      right: 2px;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      font-size: 10px;
      padding: 1px 4px;
      border-radius: 3px;
      font-weight: 600;
    }

    .item-details {
      flex: 1;
      min-width: 0;
    }

    .item-name {
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: #333;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 180px;
    }

    .item-meta {
      display: flex;
      gap: 6px;
      margin-top: 4px;
      align-items: center;
    }

    .type-badge {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .image-badge {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .pdf-badge {
      background: #fff3e0;
      color: #e65100;
    }

    .rotation-badge {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      background: #e3f2fd;
      color: #1565c0;
      font-weight: 600;
    }

    .item-actions {
      display: flex;
      gap: 4px;
      flex-shrink: 0;
    }

    .action-btn {
      width: 28px;
      height: 28px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: #fff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      transition: all 0.15s ease;
      padding: 0;
      line-height: 1;
    }

    .action-btn:hover {
      background: #f0f0f0;
    }

    .rotate-btn:hover {
      border-color: #ff9800;
      color: #ff9800;
    }

    .duplicate-btn:hover {
      border-color: #4caf50;
      color: #4caf50;
    }

    .remove-btn:hover {
      border-color: #f44336;
      color: #f44336;
    }

    .selection-indicator {
      flex-shrink: 0;
    }

    .selection-checkbox {
      width: 18px;
      height: 18px;
      cursor: pointer;
      accent-color: #1976d2;
    }
  `]
})
export class DocumentItemCardComponent {
  /** Queue item to display */
  @Input({ required: true }) item!: DocumentItem;

  /** Index of this item in the queue */
  @Input({ required: true }) index!: number;

  /** Emitted when user requests to toggle selection */
  @Output() onToggleSelect = new EventEmitter<number>();

  /** Emitted when user requests to remove the item */
  @Output() onRemove = new EventEmitter<number>();

  /** Emitted when user requests to rotate the item */
  @Output() onRotate = new EventEmitter<number>();

  /** Emitted when user requests to duplicate the item */
  @Output() onDuplicate = new EventEmitter<number>();
}