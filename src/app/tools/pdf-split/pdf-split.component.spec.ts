import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';
import { PdfSplitComponent } from './pdf-split.component';
import { FileService, FileObject, FileValidationError } from '../../services/file.service';
import { PDFSplitService } from '../../services/pdf-split.service';

describe('PdfSplitComponent', () => {
  let component: PdfSplitComponent;
  let fixture: ComponentFixture<PdfSplitComponent>;
  let fileServiceSpy: Partial<FileService>;
  let pdfSplitServiceSpy: Partial<PDFSplitService>;

  beforeEach(async () => {
    fileServiceSpy = {
      processFiles: vi.fn(() =>
        Promise.resolve({
          successful: [
            {
              name: 'test.pdf',
              url: 'data:application/pdf;base64,test',
              size: 1024,
              type: 'application/pdf',
              fileType: 'pdf' as const
            }
          ] as FileObject[],
          errors: [] as FileValidationError[]
        })
      )
    };

    pdfSplitServiceSpy = {
      getPageCount: vi.fn(() => Promise.resolve(10)),
      splitPDF: vi.fn(() =>
        Promise.resolve([new Blob(['pdf'], { type: 'application/pdf' })])
      ),
      downloadPDFs: vi.fn(),
      sanitizeFileName: vi.fn((name) => name),
      parsePageRange: vi.fn((range) => [1, 2, 3])
    };

    await TestBed.configureTestingModule({
      imports: [CommonModule, FormsModule, PdfSplitComponent],
      providers: [
        { provide: FileService, useValue: fileServiceSpy },
        { provide: PDFSplitService, useValue: pdfSplitServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PdfSplitComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have tool definition', () => {
    expect(component.toolDefinition).toBeDefined();
    expect(component.toolDefinition.id).toBe('pdf-split');
    expect(component.toolDefinition.enabled).toBe(true);
  });

  it('should initialize with empty state', () => {
    expect(component.uploadedPdf).toBeNull();
    expect(component.pageCount).toBe(0);
    expect(component.pageRange).toBe('');
    expect(component.outputMode).toBe('single');
    expect(component.splitFileName).toBe('split-document');
  });

  describe('onFilesSelected', () => {
    it('should process selected PDF files', async () => {
      const mockFileList = [] as any[];
      await component.onFilesSelected(mockFileList);

      expect(fileServiceSpy.processFiles).toHaveBeenCalled();
    });

    it('should set uploadedPdf and page count on successful selection', async () => {
      const mockFileList = [] as any[];
      await component.onFilesSelected(mockFileList);

      expect(component.uploadedPdf).toBeTruthy();
      expect(component.uploadedPdf?.name).toBe('test.pdf');
      expect(component.pageCount).toBe(10);
      expect(pdfSplitServiceSpy.getPageCount).toHaveBeenCalled();
    });

    it('should clear previous page range on new PDF selection', async () => {
      component.pageRange = '1-5';
      const mockFileList = [] as any[];
      await component.onFilesSelected(mockFileList);

      expect(component.pageRange).toBe('');
    });

    it('should clear validation errors on new PDF selection', async () => {
      component.validationErrors = [{ fileName: 'test.txt', reason: 'unsupported-type' }];
      const mockFileList = [] as any[];
      await component.onFilesSelected(mockFileList);

      expect(component.validationErrors).toEqual([]);
    });
  });

  describe('onPdfRemoved', () => {
    beforeEach(async () => {
      const mockFileList = [] as any[];
      await component.onFilesSelected(mockFileList);
    });

    it('should clear uploaded PDF', () => {
      component.onPdfRemoved();

      expect(component.uploadedPdf).toBeNull();
      expect(component.pageCount).toBe(0);
    });

    it('should clear page range', () => {
      component.pageRange = '1-5';
      component.onPdfRemoved();

      expect(component.pageRange).toBe('');
    });

    it('should clear validation errors', () => {
      component.validationErrors = [{ fileName: 'test', reason: 'read-error' }];
      component.onPdfRemoved();

      expect(component.validationErrors).toEqual([]);
    });
  });

  describe('isSplitDisabled', () => {
    it('should return true when no PDF uploaded', () => {
      expect(component.isSplitDisabled()).toBe(true);
    });

    it('should return true when no page range specified', async () => {
      const mockFileList = [] as any[];
      await component.onFilesSelected(mockFileList);
      expect(component.isSplitDisabled()).toBe(true);
    });

    it('should return false when PDF and page range provided', async () => {
      const mockFileList = [] as any[];
      await component.onFilesSelected(mockFileList);
      component.pageRange = '1-3';
      expect(component.isSplitDisabled()).toBe(false);
    });

    it('should return true when splitting is in progress', async () => {
      const mockFileList = [] as any[];
      await component.onFilesSelected(mockFileList);
      component.pageRange = '1-3';
      component.isSplitting = true;
      expect(component.isSplitDisabled()).toBe(true);
    });
  });

  describe('getSplitButtonLabel', () => {
    it('should show uploading message when no PDF', () => {
      const label = component.getSplitButtonLabel();
      expect(label).toBe('Upload PDF to start');
    });

    it('should show splitting message during operation', () => {
      component.isSplitting = true;
      const label = component.getSplitButtonLabel();
      expect(label).toBe('Splitting...');
    });

    it('should show range message when no page range', async () => {
      const mockFileList = [] as any[];
      await component.onFilesSelected(mockFileList);
      const label = component.getSplitButtonLabel();
      expect(label).toBe('Specify page range');
    });

    it('should show extraction label for single mode', async () => {
      const mockFileList = [] as any[];
      await component.onFilesSelected(mockFileList);
      component.pageRange = '1-3';
      component.outputMode = 'single';
      const label = component.getSplitButtonLabel();
      expect(label).toBe('Extract Pages');
    });

    it('should show separate label for separate mode', async () => {
      const mockFileList = [] as any[];
      await component.onFilesSelected(mockFileList);
      component.pageRange = '1-3';
      component.outputMode = 'separate';
      const label = component.getSplitButtonLabel();
      expect(label).toBe('Extract as Separate PDFs');
    });
  });

  describe('onSplitPDF', () => {
    beforeEach(async () => {
      const mockFileList = [] as any[];
      await component.onFilesSelected(mockFileList);
      component.pageRange = '1-3';
    });

    it('should show error when no PDF uploaded', async () => {
      component.uploadedPdf = null;
      await component.onSplitPDF();

      expect(component.generalError).toBeTruthy();
    });

    it('should show error when no page range specified', async () => {
      component.pageRange = '';
      await component.onSplitPDF();

      expect(component.generalError).toBeTruthy();
    });

    it('should call split service with correct parameters', async () => {
      component.outputMode = 'single';
      await component.onSplitPDF();

      expect(pdfSplitServiceSpy.splitPDF).toHaveBeenCalledWith(
        component.uploadedPdf,
        '1-3',
        expect.any(String),
        { outputMode: 'single' }
      );
    });

    it('should download PDFs on success', async () => {
      await component.onSplitPDF();

      expect(pdfSplitServiceSpy.downloadPDFs).toHaveBeenCalled();
    });

    it('should set error on failure', async () => {
      pdfSplitServiceSpy.splitPDF = vi.fn(() => Promise.reject(new Error('Split failed')));
      await component.onSplitPDF();

      expect(component.generalError).toBeTruthy();
      expect(component.generalError).toContain('Split failed');
    });

    it('should reset splitting flag after operation', async () => {
      await component.onSplitPDF();

      expect(component.isSplitting).toBe(false);
    });
  });

  describe('clearAll', () => {
    beforeEach(async () => {
      const mockFileList = [] as any[];
      await component.onFilesSelected(mockFileList);
      component.pageRange = '1-5';
      component.outputMode = 'separate';
      component.splitFileName = 'custom-name';
      component.generalError = 'Some error';
    });

    it('should clear all form state', () => {
      component.clearAll();

      expect(component.uploadedPdf).toBeNull();
      expect(component.pageCount).toBe(0);
      expect(component.pageRange).toBe('');
      expect(component.outputMode).toBe('single');
      expect(component.splitFileName).toBe('split-document');
      expect(component.generalError).toBeNull();
    });
  });

  describe('onDragOverZone and onDragLeaveZone', () => {
    it('should toggle dragging state', () => {
      component.onDragOverZone();
      expect(component.isDragging).toBe(true);

      component.onDragLeaveZone();
      expect(component.isDragging).toBe(false);
    });
  });

  describe('getInfoText', () => {
    it('should show upload message when no PDF', () => {
      const text = component.getInfoText();
      expect(text).toBe('Upload a PDF to extract specific pages');
    });

    it('should show page info when PDF uploaded', async () => {
      const mockFileList = [] as any[];
      await component.onFilesSelected(mockFileList);
      const text = component.getInfoText();
      expect(text).toContain('10 pages');
    });
  });
});
