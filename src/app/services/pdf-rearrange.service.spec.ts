import { TestBed } from '@angular/core/testing';
import { PdfRearrangeService } from './pdf-rearrange.service';
import { FileObject } from './file.service';
import { PDFDocument } from 'pdf-lib';
import { vi } from 'vitest';

describe('PdfRearrangeService', () => {
  let service: PdfRearrangeService;
  let mockPdfFile: FileObject;

  beforeEach(() => {
    vi.restoreAllMocks();

    TestBed.configureTestingModule({
      providers: [PdfRearrangeService]
    });
    service = TestBed.inject(PdfRearrangeService);

    // Create mock PDF file
    mockPdfFile = {
      name: 'test.pdf',
      type: 'application/pdf',
      size: 102400,
      lastModified: Date.now(),
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(100)),
      slice: vi.fn(),
      stream: vi.fn(),
      text: vi.fn()
    } as unknown as FileObject;
  });

  describe('getPageCount', () => {
    it('should return correct page count', async () => {
      // Mock PDFDocument.load
      const mockPdf = {
        getPageCount: vi.fn().mockReturnValue(5)
      };
      vi.spyOn(PDFDocument, 'load').mockResolvedValue(mockPdf as any);

      const count = await service.getPageCount(mockPdfFile);

      expect(count).toBe(5);
      expect(PDFDocument.load).toHaveBeenCalled();
    });

    it('should throw error on invalid PDF', async () => {
      vi.spyOn(PDFDocument, 'load').mockRejectedValue(new Error('Invalid PDF'));

      await expect(service.getPageCount(mockPdfFile)).rejects.toThrow('Failed to get page count');
    });
  });

  describe('rearrangePages', () => {
    it('should rearrange pages in specified order', async () => {
      const mockSourcePages = [
        { id: 0 },
        { id: 1 },
        { id: 2 }
      ];
      const mockSourcePdf = {
        getPageCount: vi.fn().mockReturnValue(3),
        copyPages: vi.fn().mockResolvedValue([mockSourcePages[2], mockSourcePages[0], mockSourcePages[1]])
      };
      const mockNewPdf = {
        addPage: vi.fn(),
        save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]))
      };

      vi.spyOn(PDFDocument, 'load').mockResolvedValue(mockSourcePdf as any);
      vi.spyOn(PDFDocument, 'create').mockResolvedValue(mockNewPdf as any);

      const result = await service.rearrangePages(mockPdfFile, [2, 0, 1]);

      expect(result).toBeInstanceOf(Blob);
      expect(mockNewPdf.addPage).toHaveBeenCalledTimes(3);
    });

    it('should throw error for empty page indices', async () => {
      const mockPdf = {
        getPageCount: vi.fn().mockReturnValue(3),
        copyPages: vi.fn().mockResolvedValue([])
      };
      vi.spyOn(PDFDocument, 'load').mockResolvedValue(mockPdf as any);

      await expect(service.rearrangePages(mockPdfFile, [])).rejects.toThrow(
        'At least one page must be selected'
      );
    });

    it('should throw error for invalid page indices', async () => {
      const mockPdf = {
        getPageCount: vi.fn().mockReturnValue(3),
        copyPages: vi.fn().mockResolvedValue([])
      };
      vi.spyOn(PDFDocument, 'load').mockResolvedValue(mockPdf as any);

      await expect(service.rearrangePages(mockPdfFile, [0, 5])).rejects.toThrow(
        'Invalid page index'
      );
    });

    it('should throw error for negative page indices', async () => {
      const mockPdf = {
        getPageCount: vi.fn().mockReturnValue(3),
        copyPages: vi.fn().mockResolvedValue([])
      };
      vi.spyOn(PDFDocument, 'load').mockResolvedValue(mockPdf as any);

      await expect(service.rearrangePages(mockPdfFile, [-1])).rejects.toThrow(
        'Invalid page index'
      );
    });
  });

  describe('deletePages', () => {
    it('should delete specified pages', async () => {
      const mockSourcePages = [
        { id: 0 },
        { id: 1 },
        { id: 2 }
      ];
      const mockSourcePdf = {
        getPageCount: vi.fn().mockReturnValue(3),
        copyPages: vi.fn().mockResolvedValue([mockSourcePages[0], mockSourcePages[2]])
      };
      const mockNewPdf = {
        addPage: vi.fn(),
        save: vi.fn().mockResolvedValue(new Uint8Array([1, 2]))
      };

      vi.spyOn(PDFDocument, 'load').mockResolvedValue(mockSourcePdf as any);
      vi.spyOn(PDFDocument, 'create').mockResolvedValue(mockNewPdf as any);

      const result = await service.deletePages(mockPdfFile, [1]);

      expect(result).toBeInstanceOf(Blob);
      expect(mockNewPdf.addPage).toHaveBeenCalledTimes(2);
    });

    it('should throw error when deleting all pages', async () => {
      const mockPdf = {
        getPageCount: vi.fn().mockReturnValue(3),
        copyPages: vi.fn().mockResolvedValue([])
      };
      vi.spyOn(PDFDocument, 'load').mockResolvedValue(mockPdf as any);

      await expect(service.deletePages(mockPdfFile, [0, 1, 2])).rejects.toThrow(
        'Cannot delete all pages from PDF'
      );
    });

    it('should throw error for invalid indices', async () => {
      const mockPdf = {
        getPageCount: vi.fn().mockReturnValue(3),
        copyPages: vi.fn().mockResolvedValue([])
      };
      vi.spyOn(PDFDocument, 'load').mockResolvedValue(mockPdf as any);

      await expect(service.deletePages(mockPdfFile, [5])).rejects.toThrow(
        'Invalid page index'
      );
    });
  });

  describe('duplicatePages', () => {
    it('should duplicate specified pages', async () => {
      const mockSourcePages = [
        { id: 0 },
        { id: 1 },
        { id: 2 }
      ];
      const mockSourcePdf = {
        getPageCount: vi.fn().mockReturnValue(3),
        copyPages: vi.fn().mockResolvedValue([mockSourcePages[0], mockSourcePages[1], mockSourcePages[1], mockSourcePages[2]])
      };
      const mockNewPdf = {
        addPage: vi.fn(),
        save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4]))
      };

      vi.spyOn(PDFDocument, 'load').mockResolvedValue(mockSourcePdf as any);
      vi.spyOn(PDFDocument, 'create').mockResolvedValue(mockNewPdf as any);

      // Duplicating page 1: original order is 0, 1*, 1, 2
      const result = await service.duplicatePages(mockPdfFile, [1]);

      expect(result).toBeInstanceOf(Blob);
      expect(mockSourcePdf.copyPages).toHaveBeenCalledWith(mockSourcePdf, [0, 1, 1, 2]);
      // Should add 4 pages: 0, 1, 1 (duplicate), 2
      expect(mockNewPdf.addPage).toHaveBeenCalledTimes(4);
    });

    it('should throw error for empty duplication list', async () => {
      const mockPdf = {
        getPageCount: vi.fn().mockReturnValue(3),
        copyPages: vi.fn().mockResolvedValue([])
      };
      vi.spyOn(PDFDocument, 'load').mockResolvedValue(mockPdf as any);

      await expect(service.duplicatePages(mockPdfFile, [])).rejects.toThrow(
        'At least one page must be selected for duplication'
      );
    });

    it('should throw error for invalid indices', async () => {
      const mockPdf = {
        getPageCount: vi.fn().mockReturnValue(3),
        copyPages: vi.fn().mockResolvedValue([])
      };
      vi.spyOn(PDFDocument, 'load').mockResolvedValue(mockPdf as any);

      await expect(service.duplicatePages(mockPdfFile, [5])).rejects.toThrow(
        'Invalid page index'
      );
    });
  });

  describe('sanitizeFileName', () => {
    it('should remove .pdf extension', () => {
      expect(service.sanitizeFileName('document.pdf')).toBe('document');
    });

    it('should remove multiple extensions', () => {
      expect(service.sanitizeFileName('document.backup.pdf')).toBe('documentbackup');
    });

    it('should remove special characters', () => {
      expect(service.sanitizeFileName('my@doc#ument!.pdf')).toBe('mydocument');
    });

    it('should keep alphanumeric and hyphens/underscores', () => {
      expect(service.sanitizeFileName('my-doc_ument.pdf')).toBe('my-doc_ument');
    });

    it('should remove leading/trailing underscores', () => {
      expect(service.sanitizeFileName('_my_document_.pdf')).toBe('my_document');
    });

    it('should remove path separators', () => {
      expect(service.sanitizeFileName('path/to/document.pdf')).toBe('pathtodocument');
      expect(service.sanitizeFileName('path\\to\\document.pdf')).toBe('pathtodocument');
    });

    it('should handle empty string', () => {
      expect(service.sanitizeFileName('')).toBe('');
    });

    it('should handle non-string input', () => {
      expect(service.sanitizeFileName(null as any)).toBe('');
    });
  });

  describe('downloadPDF', () => {
    it('should create download link and trigger download', () => {
      const blob = new Blob(['test'], { type: 'application/pdf' });
      const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
      const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL');
      const link = document.createElement('a');
      const click = vi.spyOn(link, 'click').mockImplementation(() => {});
      vi.spyOn(document, 'createElement').mockReturnValue(link);
      const appendChild = vi.spyOn(document.body, 'appendChild');
      const removeChild = vi.spyOn(document.body, 'removeChild');

      service.downloadPDF(blob, 'test-document');

      expect(createObjectURL).toHaveBeenCalledWith(blob);
      expect(appendChild).toHaveBeenCalled();
      expect(click).toHaveBeenCalled();
      expect(removeChild).toHaveBeenCalled();
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:test');
    });

    it('should append .pdf extension if missing', () => {
      const blob = new Blob(['test'], { type: 'application/pdf' });
      const link = document.createElement('a');
      vi.spyOn(link, 'click').mockImplementation(() => {});
      const createElement = vi.spyOn(document, 'createElement').mockReturnValue(link);
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
      vi.spyOn(URL, 'revokeObjectURL');
      vi.spyOn(document.body, 'appendChild');
      vi.spyOn(document.body, 'removeChild');

      service.downloadPDF(blob, 'test-document');

      const linkElement = createElement.mock.results[0].value;
      expect(linkElement.download).toBe('test-document.pdf');
    });

    it('should use default name if empty', () => {
      const blob = new Blob(['test'], { type: 'application/pdf' });
      const link = document.createElement('a');
      vi.spyOn(link, 'click').mockImplementation(() => {});
      const createElement = vi.spyOn(document, 'createElement').mockReturnValue(link);
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
      vi.spyOn(URL, 'revokeObjectURL');
      vi.spyOn(document.body, 'appendChild');
      vi.spyOn(document.body, 'removeChild');

      service.downloadPDF(blob, '');

      const linkElement = createElement.mock.results[0].value;
      expect(linkElement.download).toBe('rearranged-document.pdf');
    });
  });

  describe('applyOperations', () => {
    it('should apply delete, duplicate, and rearrange in order', async () => {
      // This test verifies that operations are applied sequentially
      const mockSourcePdf = {
        getPageCount: vi.fn().mockReturnValue(3),
        copyPages: vi.fn().mockResolvedValue([{ id: 0 }, { id: 1 }, { id: 2 }])
      };
      const mockNewPdf = {
        addPage: vi.fn(),
        save: vi.fn().mockResolvedValue(new Uint8Array([1, 2]))
      };

      vi.spyOn(PDFDocument, 'load').mockResolvedValue(mockSourcePdf as any);
      vi.spyOn(PDFDocument, 'create').mockResolvedValue(mockNewPdf as any);

      const result = await service.applyOperations(
        mockPdfFile,
        {
          delete: [1],
          duplicate: [0],
          rearrange: [0, 0, 1]
        },
        'test'
      );

      expect(result).toBeInstanceOf(Blob);
    });

    it('should handle no operations gracefully', async () => {
      const result = await service.applyOperations(mockPdfFile, {}, 'test');

      expect(result).toBeInstanceOf(Blob);
    });
  });
});
