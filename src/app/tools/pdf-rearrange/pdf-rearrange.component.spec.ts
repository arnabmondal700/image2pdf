import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PdfRearrangeComponent } from './pdf-rearrange.component';
import { FileService, FileObject, FileValidationError } from '../../services/file.service';
import { PdfRearrangeService } from '../../services/pdf-rearrange.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { vi } from 'vitest';

describe('PdfRearrangeComponent', () => {
  let component: PdfRearrangeComponent;
  let fixture: ComponentFixture<PdfRearrangeComponent>;
  let fileService: FileService;
  let pdfRearrangeService: PdfRearrangeService;
  let mockPdfFile: FileObject;

  beforeEach(async () => {
    const fileServiceSpy = {
      processFiles: vi.fn()
    };
    const pdfRearrangeServiceSpy = {
      getPageCount: vi.fn(),
      rearrangePages: vi.fn(),
      deletePages: vi.fn(),
      duplicatePages: vi.fn(),
      downloadPDF: vi.fn(),
      sanitizeFileName: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [PdfRearrangeComponent, CommonModule, FormsModule, DragDropModule],
      providers: [
        { provide: FileService, useValue: fileServiceSpy },
        { provide: PdfRearrangeService, useValue: pdfRearrangeServiceSpy }
      ]
    }).compileComponents();

    fileService = TestBed.inject(FileService);
    pdfRearrangeService = TestBed.inject(PdfRearrangeService);
    fixture = TestBed.createComponent(PdfRearrangeComponent);
    component = fixture.componentInstance;

    // Setup mock PDF file
    mockPdfFile = {
      name: 'test.pdf',
      type: 'application/pdf',
      size: 102400,
      lastModified: Date.now(),
      arrayBuffer: vi.fn(),
      slice: vi.fn(),
      stream: vi.fn(),
      text: vi.fn()
    } as unknown as FileObject;
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      expect(component.uploadedPdf).toBeNull();
      expect(component.pageCount).toBe(0);
      expect(component.pages).toEqual([]);
      expect(component.outputFileName).toBe('');
      expect(component.isRearranging).toBeFalsy();
      expect(component.isDragging).toBeFalsy();
      expect(component.validationErrors).toEqual([]);
      expect(component.generalError).toBeNull();
    });

    it('should have tool definition configured', () => {
      expect(component.toolDefinition).toEqual({
        id: 'pdf-rearrange',
        name: 'Rearrange PDF',
        description: 'Reorder, delete, or duplicate pages in a PDF',
        icon: 'fa-solid fa-copy',
        path: 'rearrange',
        category: 'rearrange',
        enabled: true,
        priority: 70
      });
    });
  });

  describe('onFilesSelected', () => {
    it('should load PDF and initialize pages', async () => {
      const files: any[] = [mockPdfFile];
      (fileService.processFiles as any).mockResolvedValue({ successful: [mockPdfFile], errors: [] });
      (pdfRearrangeService.getPageCount as any).mockResolvedValue(5);
      (pdfRearrangeService.sanitizeFileName as any).mockReturnValue('test');

      await component.onFilesSelected(files);

      expect(component.uploadedPdf).toBe(mockPdfFile);
      expect(component.pageCount).toBe(5);
      expect(component.pages).toHaveLength(5);
      expect(component.pages[0]).toEqual({
        index: 0,
        displayIndex: 1,
        isDuplicate: false
      });
      expect(component.outputFileName).toBe('test');
    });

    it('should handle non-PDF files validation', async () => {
      const txtFile: FileObject = {
        name: 'test.txt',
        type: 'text/plain',
        size: 1024,
        url: 'blob:test'
      };

      const validationError: FileValidationError = {
        fileName: 'test.txt',
        reason: 'unsupported-type'
      };

      (fileService.processFiles as any).mockResolvedValue({ successful: [txtFile], errors: [validationError] });

      await component.onFilesSelected([txtFile as any]);

      expect(component.uploadedPdf).toBeNull();
      expect(component.validationErrors).toEqual([validationError]);
    });

    it('should clear previous errors on new upload', async () => {
      component.generalError = 'Previous error';
      component.validationErrors = [{ fileName: 'old.txt', reason: 'unsupported-type' }];

      (fileService.processFiles as any).mockResolvedValue({ successful: [mockPdfFile], errors: [] });
      (pdfRearrangeService.getPageCount as any).mockResolvedValue(3);
      (pdfRearrangeService.sanitizeFileName as any).mockReturnValue('test');

      await component.onFilesSelected([mockPdfFile as any]);

      expect(component.generalError).toBeNull();
      expect(component.validationErrors).toEqual([]);
    });

    it('should handle PDF loading errors', async () => {
      (fileService.processFiles as any).mockResolvedValue({ successful: [mockPdfFile], errors: [] });
      (pdfRearrangeService.getPageCount as any).mockRejectedValue(
        new Error('Failed to load PDF')
      );

      await component.onFilesSelected([mockPdfFile as any]);

      expect(component.generalError).toBe('Failed to load PDF');
      expect(component.uploadedPdf).toBeNull();
    });
  });

  describe('onPdfRemoved', () => {
    it('should clear all PDF-related state', () => {
      component.uploadedPdf = mockPdfFile;
      component.pageCount = 5;
      component.pages = [{ index: 0, displayIndex: 1 }];
      component.outputFileName = 'test';
      component.validationErrors = [{ fileName: 'test.pdf', reason: 'unsupported-type' }];
      component.generalError = 'Some error';

      component.onPdfRemoved();

      expect(component.uploadedPdf).toBeNull();
      expect(component.pageCount).toBe(0);
      expect(component.pages).toEqual([]);
      expect(component.outputFileName).toBe('');
      expect(component.validationErrors).toEqual([]);
      expect(component.generalError).toBeNull();
    });
  });

  describe('deletePage', () => {
    beforeEach(() => {
      component.pages = [
        { index: 0, displayIndex: 1 },
        { index: 1, displayIndex: 2 },
        { index: 2, displayIndex: 3 }
      ];
    });

    it('should delete page at specified index', () => {
      component.deletePage(1);

      expect(component.pages).toHaveLength(2);
      expect(component.pages[0]).toEqual({ index: 0, displayIndex: 1 });
      expect(component.pages[1]).toEqual({ index: 2, displayIndex: 2 });
    });

    it('should update display indices after deletion', () => {
      component.deletePage(0);

      expect(component.pages[0].displayIndex).toBe(1);
      expect(component.pages[1].displayIndex).toBe(2);
    });

    it('should ignore invalid delete indices', () => {
      component.deletePage(99);

      expect(component.pages).toHaveLength(3);
      expect(component.pages.map(page => page.index)).toEqual([0, 1, 2]);
    });

    it('should keep the final remaining page', () => {
      component.pages = [{ index: 0, displayIndex: 1 }];

      component.deletePage(0);

      expect(component.pages).toEqual([{ index: 0, displayIndex: 1 }]);
    });
  });

  describe('duplicatePage', () => {
    beforeEach(() => {
      component.pages = [
        { index: 0, displayIndex: 1 },
        { index: 1, displayIndex: 2 },
        { index: 2, displayIndex: 3 }
      ];
    });

    it('should duplicate page right after original', () => {
      component.duplicatePage(1);

      expect(component.pages).toHaveLength(4);
      expect(component.pages[2]).toEqual({ index: 1, displayIndex: 3, isDuplicate: true });
    });

    it('should update display indices after duplication', () => {
      component.duplicatePage(1);

      expect(component.pages[2].displayIndex).toBe(3);
      expect(component.pages[3].displayIndex).toBe(4);
    });

    it('should ignore invalid duplicate indices', () => {
      component.duplicatePage(99);

      expect(component.pages).toHaveLength(3);
      expect(component.pages.map(page => page.index)).toEqual([0, 1, 2]);
    });
  });

  describe('onDragDrop', () => {
    beforeEach(() => {
      component.pages = [
        { index: 0, displayIndex: 1 },
        { index: 1, displayIndex: 2 },
        { index: 2, displayIndex: 3 }
      ];
    });

    it('should reorder pages on drop', () => {
      const dropEvent = {
        previousIndex: 0,
        currentIndex: 2
      } as CdkDragDrop<any>;

      component.onDragDrop(dropEvent);

      expect(component.pages[0].index).toBe(1);
      expect(component.pages[1].index).toBe(2);
      expect(component.pages[2].index).toBe(0);
    });

    it('should update display indices after drop', () => {
      const dropEvent = {
        previousIndex: 0,
        currentIndex: 2
      } as CdkDragDrop<any>;

      component.onDragDrop(dropEvent);

      expect(component.pages[0].displayIndex).toBe(1);
      expect(component.pages[1].displayIndex).toBe(2);
      expect(component.pages[2].displayIndex).toBe(3);
    });

    it('should handle no-op drag', () => {
      const originalPages = [...component.pages];
      const dropEvent = {
        previousIndex: 1,
        currentIndex: 1
      } as CdkDragDrop<any>;

      component.onDragDrop(dropEvent);

      expect(component.pages).toEqual(originalPages);
    });
  });

  describe('isRearrangeDisabled', () => {
    it('should be disabled when no PDF uploaded', () => {
      component.uploadedPdf = null;
      expect(component.isRearrangeDisabled()).toBeTruthy();
    });

    it('should be disabled when no pages', () => {
      component.uploadedPdf = mockPdfFile;
      component.pages = [];
      expect(component.isRearrangeDisabled()).toBeTruthy();
    });

    it('should be disabled when rearranging', () => {
      component.uploadedPdf = mockPdfFile;
      component.pages = [{ index: 0, displayIndex: 1 }];
      component.isRearranging = true;
      expect(component.isRearrangeDisabled()).toBeTruthy();
    });

    it('should be enabled when PDF loaded with pages', () => {
      component.uploadedPdf = mockPdfFile;
      component.pages = [{ index: 0, displayIndex: 1 }];
      component.isRearranging = false;
      expect(component.isRearrangeDisabled()).toBeFalsy();
    });
  });

  describe('resetPageOrder and hasPageChanges', () => {
    beforeEach(() => {
      component.uploadedPdf = mockPdfFile;
      component.pageCount = 3;
      component.pages = [
        { index: 0, displayIndex: 1 },
        { index: 1, displayIndex: 2 },
        { index: 2, displayIndex: 3 }
      ];
    });

    it('should detect unchanged page order', () => {
      expect(component.hasPageChanges()).toBeFalsy();
    });

    it('should detect reordered pages', () => {
      component.pages = [
        { index: 2, displayIndex: 1 },
        { index: 0, displayIndex: 2 },
        { index: 1, displayIndex: 3 }
      ];

      expect(component.hasPageChanges()).toBeTruthy();
    });

    it('should detect duplicated pages', () => {
      component.duplicatePage(1);

      expect(component.hasPageChanges()).toBeTruthy();
    });

    it('should reset edits while keeping the uploaded PDF', () => {
      component.pages = [
        { index: 2, displayIndex: 1 },
        { index: 0, displayIndex: 2 },
        { index: 1, displayIndex: 3 },
        { index: 1, displayIndex: 4, isDuplicate: true }
      ];
      component.generalError = 'Previous error';

      component.resetPageOrder();

      expect(component.uploadedPdf).toBe(mockPdfFile);
      expect(component.pages).toEqual([
        { index: 0, displayIndex: 1, isDuplicate: false },
        { index: 1, displayIndex: 2, isDuplicate: false },
        { index: 2, displayIndex: 3, isDuplicate: false }
      ]);
      expect(component.generalError).toBeNull();
    });
  });

  describe('getRearrangeButtonLabel', () => {
    it('should show "Applying changes..." when rearranging', () => {
      component.isRearranging = true;
      expect(component.getRearrangeButtonLabel()).toBe('Applying changes...');
    });

    it('should show upload prompt when no PDF', () => {
      component.uploadedPdf = null;
      expect(component.getRearrangeButtonLabel()).toBe('Upload PDF to start');
    });

    it('should show page count when ready', () => {
      component.uploadedPdf = mockPdfFile;
      component.pages = [{ index: 0, displayIndex: 1 }, { index: 1, displayIndex: 2 }];
      expect(component.getRearrangeButtonLabel()).toBe('Apply Changes (2 pages)');
    });
  });

  describe('onApplyChanges', () => {
    beforeEach(() => {
      component.uploadedPdf = mockPdfFile;
      component.pages = [
        { index: 2, displayIndex: 1 },
        { index: 0, displayIndex: 2 },
        { index: 1, displayIndex: 3 }
      ];
      component.outputFileName = 'rearranged';
    });

    it('should apply changes and download', async () => {
      const mockBlob = new Blob(['test'], { type: 'application/pdf' });
      (pdfRearrangeService.rearrangePages as any).mockResolvedValue(mockBlob);

      await component.onApplyChanges();

      expect(pdfRearrangeService.rearrangePages).toHaveBeenCalledWith(
        mockPdfFile,
        [2, 0, 1]
      );
      expect(pdfRearrangeService.downloadPDF).toHaveBeenCalledWith(mockBlob, 'rearranged');
      expect(component.generalError).toBeNull();
    });

    it('should handle rearrange errors', async () => {
      (pdfRearrangeService.rearrangePages as any).mockRejectedValue(
        new Error('Rearrange failed')
      );

      await component.onApplyChanges();

      expect(component.generalError).toBe('Rearrange failed');
      expect(component.isRearranging).toBeFalsy();
    });

    it('should error if no PDF uploaded', async () => {
      component.uploadedPdf = null;

      await component.onApplyChanges();

      expect(component.generalError).toBe('Please upload a PDF first');
      expect(pdfRearrangeService.rearrangePages).not.toHaveBeenCalled();
    });

    it('should error if no pages', async () => {
      component.pages = [];

      await component.onApplyChanges();

      expect(component.generalError).toBe('Please upload a PDF first');
    });

    it('should use default filename if empty', async () => {
      component.outputFileName = '';
      const mockBlob = new Blob(['test'], { type: 'application/pdf' });
      (pdfRearrangeService.rearrangePages as any).mockResolvedValue(mockBlob);
      (pdfRearrangeService.sanitizeFileName as any).mockReturnValue('');

      await component.onApplyChanges();

      expect(pdfRearrangeService.downloadPDF).toHaveBeenCalledWith(mockBlob, 'rearranged-document');
    });
  });

  describe('clearAll', () => {
    it('should reset entire form', () => {
      component.uploadedPdf = mockPdfFile;
      component.pageCount = 5;
      component.pages = [{ index: 0, displayIndex: 1 }];
      component.outputFileName = 'test';
      component.generalError = 'Some error';

      component.clearAll();

      expect(component.uploadedPdf).toBeNull();
      expect(component.pageCount).toBe(0);
      expect(component.pages).toEqual([]);
      expect(component.outputFileName).toBe('');
      expect(component.generalError).toBeNull();
    });
  });

  describe('getInfoText', () => {
    it('should show upload prompt when no PDF', () => {
      component.uploadedPdf = null;
      expect(component.getInfoText()).toBe('Upload a PDF to begin');
    });

    it('should show "no pages" when empty', () => {
      component.uploadedPdf = mockPdfFile;
      component.pages = [];
      expect(component.getInfoText()).toBe('No pages selected');
    });

    it('should show page count with duplicates', () => {
      component.uploadedPdf = mockPdfFile;
      component.pages = [
        { index: 0, displayIndex: 1 },
        { index: 1, displayIndex: 2 },
        { index: 0, displayIndex: 3, isDuplicate: true }
      ];
      expect(component.getInfoText()).toBe('3 pages total (1 duplicates)');
    });

    it('should show page count without duplicates', () => {
      component.uploadedPdf = mockPdfFile;
      component.pages = [
        { index: 0, displayIndex: 1 },
        { index: 1, displayIndex: 2 },
        { index: 2, displayIndex: 3 }
      ];
      expect(component.getInfoText()).toBe('3 pages in current order');
    });
  });

  describe('getPageSourceLabel', () => {
    it('should show source page for original pages', () => {
      expect(component.getPageSourceLabel({ index: 2, displayIndex: 1 })).toBe('Source page 3');
    });

    it('should show source page copy for duplicates', () => {
      expect(component.getPageSourceLabel({ index: 1, displayIndex: 2, isDuplicate: true })).toBe('Source page 2 copy');
    });
  });

  describe('Drag-drop visual feedback', () => {
    it('should set isDragging on drag over', () => {
      component.onDragOverZone({ preventDefault: vi.fn() } as unknown as DragEvent);
      expect(component.isDragging).toBeTruthy();
    });

    it('should clear isDragging on drag leave', () => {
      component.isDragging = true;
      component.onDragLeaveZone();
      expect(component.isDragging).toBeFalsy();
    });
  });
});
