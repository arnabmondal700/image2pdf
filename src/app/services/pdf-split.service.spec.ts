import { TestBed } from '@angular/core/testing';
import { PDFSplitService } from './pdf-split.service';

describe('PDFSplitService', () => {
  let service: PDFSplitService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PDFSplitService]
    });
    service = TestBed.inject(PDFSplitService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('parsePageRange', () => {
    it('should parse single page', () => {
      const result = service.parsePageRange('1');
      expect(result).toEqual([1]);
    });

    it('should parse multiple single pages', () => {
      const result = service.parsePageRange('1, 3, 5');
      expect(result).toEqual([1, 3, 5]);
    });

    it('should parse page range', () => {
      const result = service.parsePageRange('1-3');
      expect(result).toEqual([1, 2, 3]);
    });

    it('should parse mixed page ranges and single pages', () => {
      const result = service.parsePageRange('1-3, 5, 7-10');
      expect(result).toEqual([1, 2, 3, 5, 7, 8, 9, 10]);
    });

    it('should sort and deduplicate page numbers', () => {
      const result = service.parsePageRange('5, 1-3, 5, 2');
      expect(result).toEqual([1, 2, 3, 5]);
    });

    it('should handle whitespace', () => {
      const result = service.parsePageRange('  1 - 3  ,  5  ');
      expect(result).toEqual([1, 2, 3, 5]);
    });

    it('should return empty array for invalid input', () => {
      const result = service.parsePageRange('abc, xyz');
      expect(result).toEqual([]);
    });

    it('should ignore negative page numbers', () => {
      const result = service.parsePageRange('-1, 0, 1, 2');
      expect(result).toEqual([1, 2]);
    });

    it('should handle invalid ranges gracefully', () => {
      const result = service.parsePageRange('10-5');
      expect(result).toEqual([]);
    });
  });

  describe('sanitizeFileName', () => {
    it('should remove file extension', () => {
      const result = service.sanitizeFileName('my-document.pdf');
      expect(result).toBe('my-document');
    });

    it('should replace special characters with underscores', () => {
      const result = service.sanitizeFileName('my@document#.pdf');
      expect(result).toBe('my_document');
    });

    it('should remove leading and trailing underscores', () => {
      const result = service.sanitizeFileName('__my-document__.pdf');
      expect(result).toBe('my-document');
    });

    it('should return default name for empty input', () => {
      const result = service.sanitizeFileName('____.pdf');
      expect(result).toBe('split');
    });

    it('should preserve alphanumeric, hyphens, and underscores', () => {
      const result = service.sanitizeFileName('my-doc_123.pdf');
      expect(result).toBe('my-doc_123');
    });
  });

  describe('downloadPDF', () => {
    it('should create and trigger download', () => {
      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:http://mock');
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
      const clickSpy = vi.fn();

      const mockLink = {
        href: '',
        download: '',
        click: clickSpy
      };
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);

      const blob = new Blob(['test'], { type: 'application/pdf' });
      service.downloadPDF(blob, 'test.pdf');

      expect(createObjectURLSpy).toHaveBeenCalledWith(blob);
      expect(mockLink.href).toBe('blob:http://mock');
      expect(mockLink.download).toBe('test.pdf');
      expect(clickSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalled();

      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
      createElementSpy.mockRestore();
    });
  });

  describe('downloadPDFs', () => {
    beforeEach(() => {
      vi.spyOn(service, 'downloadPDF').mockImplementation(() => {});
    });

    it('should download single PDF without index suffix', () => {
      const blobs = [new Blob(['test'], { type: 'application/pdf' })];
      service.downloadPDFs(blobs, 'document');

      expect(service.downloadPDF).toHaveBeenCalledWith(blobs[0], 'document.pdf');
    });

    it('should download multiple PDFs with index suffixes', () => {
      const blobs = [
        new Blob(['page1'], { type: 'application/pdf' }),
        new Blob(['page2'], { type: 'application/pdf' }),
        new Blob(['page3'], { type: 'application/pdf' })
      ];
      service.downloadPDFs(blobs, 'document');

      expect(service.downloadPDF).toHaveBeenCalledWith(blobs[0], 'document_page_1.pdf');
      expect(service.downloadPDF).toHaveBeenCalledWith(blobs[1], 'document_page_2.pdf');
      expect(service.downloadPDF).toHaveBeenCalledWith(blobs[2], 'document_page_3.pdf');
    });
  });
});
