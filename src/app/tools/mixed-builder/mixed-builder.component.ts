import { Component, OnDestroy, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { Subscription } from 'rxjs';

import { DocumentItem } from '../../models/document-item.model';
import { MixedDocumentService, AddFilesResult } from '../../services/mixed-document.service';
import { MixedPdfGeneratorService } from '../../services/mixed-pdf-generator.service';
import { PdfWorkerService, GenerationProgress, PDFGenerationCancelledError } from '../../services/pdf-worker.service';
import { PDFSettings } from '../../services/pdf.service';
import { PdfSettingsStorageService } from '../../services/pdf-settings-storage.service';
import { ToolDefinition } from '../tool.interface';

import { DragDropZoneComponent } from '../../components/drag-drop-zone/drag-drop-zone.component';
import { PdfSettingsPanelComponent } from '../../components/pdf-settings-panel/pdf-settings-panel.component';
import { DocumentQueueComponent } from './document-queue/document-queue.component';
import { SeoContentComponent } from '../../components/seo-content/seo-content.component';
import { SeoContentConfigService } from '../../services/seo-content-config.service';
import type { SeoContentConfig } from '../../components/seo-content/seo-content.component';

/**
 * Mixed PDF Builder Component
 *
 * Allows users to combine images and PDF pages into a single ordered document.
 * Supports drag-drop reordering, multi-select, rotation, and duplication.
 * PDF pages are copied using pdf-lib copyPages() to preserve vector quality.
 */
@Component({
  selector: 'app-mixed-builder',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    DragDropZoneComponent,
    PdfSettingsPanelComponent,
    DocumentQueueComponent,
    SeoContentComponent,
  ],
  template: `
        <!-- Error display -->
        @if (generalError) {
          <div class="error-banner" role="alert">
            <div class="error-content">
              <strong>Error:</strong>
              <p>{{ generalError }}</p>
            </div>
          </div>
        }

        <!-- Validation errors -->
        @if (validationErrors.length > 0) {
          <div class="validation-error-banner" role="alert">
            <div class="error-content">
              <strong>Could not import {{ validationErrors.length }} file(s):</strong>
              <ul>
                @for (err of validationErrors; track err.fileName) {
                  <li>
                    <span class="error-file">{{ err.fileName }}</span>
                    <span class="error-message">{{ err.reason }}</span>
                  </li>
                }
              </ul>
            </div>
          </div>
        }

        <div class="workspace-grid">
          <section class="workspace-main" aria-label="Mixed document builder workspace">
            <!-- Drag-drop zone for file uploads -->
            <drag-drop-zone
              [isDragging]="isDragging"
              (filesSelected)="onFilesSelected($event)"
              (openFileDialog)="onDragLeaveZone()"
            ></drag-drop-zone>

            <!-- Document queue -->
            <document-queue
              [items]="documentItems"
              (onReordered)="onItemReordered($event)"
              (onToggleSelect)="onToggleSelect($event)"
              (onRemoveItem)="onRemoveItem($event)"
              (onRotateItem)="onRotateItem($event)"
              (onDuplicateItem)="onDuplicateItem($event)"
              (onRotateSelected)="onRotateSelected()"
              (onDuplicateSelected)="onDuplicateSelected()"
              (onDeleteSelected)="onDeleteSelected()"
              (onClearSelection)="onClearSelection()"
            ></document-queue>

            <!-- Select All / Deselect All -->
            @if (documentItems.length > 0) {
              <div class="selection-controls">
                <button class="text-btn" (click)="onSelectAll()">
                  {{ allSelected ? 'Deselect All' : 'Select All' }}
                </button>
                <button class="text-btn" (click)="onClearQueue()" title="Clear entire queue">
                  Clear Queue
                </button>
              </div>
            }
          </section>

          <!-- PDF settings panel -->
          <pdf-settings-panel
            [pdfSettings]="pdfSettings"
            [uploadedFiles]="[]"
            [isGenerating]="isGenerating"
            [generationProgress]="generationProgress"
            (settingsChanged)="onPDFSettingsChanged($event)"
            (generateClicked)="onGeneratePDF()"
            (cancelClicked)="onCancelGeneration()"
          ></pdf-settings-panel>
        </div>

        <seo-content [config]="seoContentConfig"></seo-content>
  `,
  styles: [`
    .selection-controls {
      display: flex;
      gap: 12px;
      padding: 8px 0;
    }

    .text-btn {
      background: none;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 6px 14px;
      font-size: 13px;
      color: #555;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .text-btn:hover {
      background: #f5f5f5;
      border-color: #1976d2;
      color: #1976d2;
    }
  `]
})
export class MixedBuilderComponent implements OnInit, OnDestroy {
  /** All document items in the queue */
  documentItems: DocumentItem[] = [];

  /** PDF settings for generation */
  pdfSettings: PDFSettings;

  /** Whether PDF is being generated */
  isGenerating = false;

  /** Whether user is dragging files over */
  isDragging = false;

  /** Generation progress info */
  generationProgress: GenerationProgress | null = null;

  /** Validation errors from file import */
  validationErrors: { fileName: string; reason: string }[] = [];

  /** General error message */
  generalError: string | null = null;

  /** Subscriptions */
  private progressSubscription?: Subscription;
  seoContentConfig: SeoContentConfig | null = null;

  /** Track if all items are selected (for UI toggle) */
  get allSelected(): boolean {
    return this.documentItems.length > 0 && this.documentItems.every((i) => i.selected);
  }

  // Injected services
  private readonly mixedDocumentService = inject(MixedDocumentService);
  private readonly mixedPdfGenerator = inject(MixedPdfGeneratorService);
  private readonly pdfWorkerService = inject(PdfWorkerService);
  private readonly settingsStorage = inject(PdfSettingsStorageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly seoContentConfigService = inject(SeoContentConfigService);

  // Tool metadata
  toolDefinition: ToolDefinition = {
    id: 'mixed-builder',
    name: 'Mixed PDF Builder',
    description: 'Combine images and PDF pages into a single document',
    icon: '📦',
    path: 'mixed-builder',
    category: 'merge',
    enabled: true,
    priority: 55,
  };

  constructor() {
    this.seoContentConfig = this.seoContentConfigService.getConfig('mixed-builder') ?? null;
    // Start with defaults; load persisted settings asynchronously
    this.pdfSettings = {
      pageSize: 'a4',
      orientation: 'portrait',
      quality: 'MEDIUM',
      dpi: 300,
      marginTop: 8,
      marginBottom: 8,
      marginLeft: 8,
      marginRight: 8,
      imageFit: 'contain',
      imageAlignment: 'center',
      backgroundColor: '#ffffff',
      imagesPerPage: 1,
      exportMode: 'single-pdf',
    };
    this.restoreSettings();
  }

  ngOnInit(): void {
    this.progressSubscription = this.pdfWorkerService.getProgress().subscribe((progress) => {
      this.generationProgress = progress;
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.progressSubscription?.unsubscribe();
  }

  /**
   * Restore persisted PDF settings asynchronously from IndexedDB/localStorage.
   */
  private async restoreSettings(): Promise<void> {
    try {
      const saved = await this.settingsStorage.loadSettings(this.toolDefinition.id);
      if (saved) {
        this.pdfSettings = saved;
        this.cdr.detectChanges();
      }
    } catch {
      // Keep defaults silently
    }
  }

  /**
   * Handle files selected from drag-drop zone or file picker
   */
  async onFilesSelected(files: FileList | File[]): Promise<void> {
    try {
      this.generalError = null;
      this.validationErrors = [];

      const result: AddFilesResult = await this.mixedDocumentService.addFilesToQueue(
        files,
        this.documentItems
      );

      this.documentItems = result.successful;
      this.validationErrors = result.errors;

      if (result.errors.length > 0 && result.successful.length === 0) {
        this.generalError = 'Failed to import files. Check the error details below.';
      }

      this.cdr.detectChanges();
    } catch (error) {
      this.generalError = error instanceof Error ? error.message : 'Error processing files';
      this.cdr.detectChanges();
    }
  }

  /**
   * Handle drag start
   */
  onDragOverZone(): void {
    this.isDragging = true;
  }

  /**
   * Handle drag leave
   */
  onDragLeaveZone(): void {
    this.isDragging = false;
  }

  /**
   * Handle item reorder from drag-drop
   */
  onItemReordered(event: { fromIndex: number; toIndex: number }): void {
    this.documentItems = this.mixedDocumentService.reorderItems(
      this.documentItems,
      event.fromIndex,
      event.toIndex
    );
    this.cdr.detectChanges();
  }

  /**
   * Handle toggle selection for a single item
   */
  onToggleSelect(index: number): void {
    this.documentItems = this.mixedDocumentService.toggleSelection(
      this.documentItems,
      index
    );
    this.cdr.detectChanges();
  }

  /**
   * Remove a single item
   */
  onRemoveItem(index: number): void {
    this.documentItems = this.mixedDocumentService.removeItems(
      this.documentItems,
      [index]
    );
    this.cdr.detectChanges();
  }

  /**
   * Rotate a single item
   */
  onRotateItem(index: number): void {
    this.documentItems = this.mixedDocumentService.rotateItem(
      this.documentItems,
      index
    );
    this.cdr.detectChanges();
  }

  /**
   * Duplicate a single item
   */
  onDuplicateItem(index: number): void {
    this.documentItems = this.mixedDocumentService.duplicateItems(
      this.documentItems,
      [index]
    );
    this.cdr.detectChanges();
  }

  /**
   * Rotate all selected items
   */
  onRotateSelected(): void {
    this.documentItems = this.mixedDocumentService.rotateSelected(
      this.documentItems
    );
    this.cdr.detectChanges();
  }

  /**
   * Duplicate all selected items
   */
  onDuplicateSelected(): void {
    this.documentItems = this.mixedDocumentService.duplicateSelected(
      this.documentItems
    );
    this.cdr.detectChanges();
  }

  /**
   * Delete all selected items
   */
  onDeleteSelected(): void {
    this.documentItems = this.mixedDocumentService.deleteSelected(
      this.documentItems
    );
    this.cdr.detectChanges();
  }

  /**
   * Clear selection
   */
  onClearSelection(): void {
    this.documentItems = this.mixedDocumentService.clearSelection(
      this.documentItems
    );
    this.cdr.detectChanges();
  }

  /**
   * Toggle select all / deselect all
   */
  onSelectAll(): void {
    this.documentItems = this.mixedDocumentService.setSelectionAll(
      this.documentItems,
      !this.allSelected
    );
    this.cdr.detectChanges();
  }

  /**
   * Clear entire queue
   */
  onClearQueue(): void {
    this.documentItems = [];
    this.validationErrors = [];
    this.generalError = null;
    this.cdr.detectChanges();
  }

  /**
   * Handle PDF settings changes
   */
  onPDFSettingsChanged(settings: PDFSettings): void {
    this.pdfSettings = settings;
    // Use sync save for immediate feedback; IndexedDB writes in the background
    this.settingsStorage.saveSettingsSync(settings, this.toolDefinition.id);
    this.cdr.detectChanges();
  }

  /**
   * Generate mixed PDF
   */
  async onGeneratePDF(): Promise<void> {
    // Validate queue
    const validation = this.mixedDocumentService.validateQueue(this.documentItems);
    if (!validation.valid) {
      this.generalError = validation.errors.join('\n');
      this.cdr.detectChanges();
      return;
    }

    this.isGenerating = true;
    this.generalError = null;

    try {
      // Generate the mixed PDF using pdf-lib
      // Images are embedded via embedJpg/embedPng
      // PDF pages are copied via copyPages() - no rasterization
      const pdfBlob = await this.mixedPdfGenerator.generateMixedPdf(
        this.documentItems,
        {
          useJpegCompression: true,
          jpegQuality: 0.92,
        }
      );

      // Download the generated PDF
      this.downloadBlob(pdfBlob, 'mixed-document.pdf');
    } catch (error) {
      if (error instanceof PDFGenerationCancelledError) {
        return;
      }
      this.generalError = error instanceof Error ? error.message : 'PDF generation failed';
      console.error('Mixed PDF generation failed:', error);
    } finally {
      this.isGenerating = false;
      this.generationProgress = null;
      this.cdr.detectChanges();
    }
  }

  /**
   * Cancel generation
   */
  onCancelGeneration(): void {
    this.pdfWorkerService.cancel();
    this.isGenerating = false;
    this.generationProgress = null;
    this.cdr.detectChanges();
  }

  /**
   * Download a blob as a file
   */
  private downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}