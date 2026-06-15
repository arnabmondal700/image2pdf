import { TestBed } from '@angular/core/testing';
import { PdfToImageService, PdfToImageOptions, ImageFormat } from './pdf-to-image.service';
import { FileObject } from './file.service';
import { vi } from 'vitest';

// Mock pdfjs-dist to avoid DOMMatrix errors in test environment
vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: {},
  getDocument: vi.fn()
}));

describe('PdfToImageService', () => {
  let service: PdfToImageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PdfToImageService]
    });
    service = TestBed.inject(PdfToImageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return default options', () => {
    const options = service.getDefaultOptions();
    expect(options.pageRange).toBe('all');
    expect(options.format).toBe('png');
    expect(options.jpegQuality).toBe(0.92);
    expect(options.scale).toBe(2);
    expect(options.outputMode).toBe('individual');
  });

  describe('parsePageRange', () => {
    it('should return all pages for "all"', () => {
      const pages = service.parsePageRange('all', 10);
      expect(pages).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });

    it('should return all pages for empty string', () => {
      const pages = service.parsePageRange('', 5);
      expect(pages).toEqual([1, 2, 3, 4, 5]);
    });

    it('should parse single page', () => {
      const pages = service.parsePageRange('3', 10);
      expect(pages).toEqual([3]);
    });

    it('should parse range with dash', () => {
      const pages = service.parsePageRange('2-5', 10);
      expect(pages).toEqual([2, 3, 4, 5]);
    });

    it('should parse comma-separated ranges and singles', () => {
      const pages = service.parsePageRange('1, 3-5, 7', 10);
      expect(pages).toEqual([1, 3, 4, 5, 7]);
    });

    it('should clamp page numbers to valid range', () => {
      const pages = service.parsePageRange('1-20', 10);
      expect(pages).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });

    it('should remove duplicates', () => {
      const pages = service.parsePageRange('1-3, 2-4', 10);
      expect(pages).toEqual([1, 2, 3, 4]);
    });

    it('should sort pages numerically', () => {
      const pages = service.parsePageRange('5, 1, 3', 10);
      expect(pages).toEqual([1, 3, 5]);
    });

    it('should handle reverse ranges', () => {
      const pages = service.parsePageRange('5-2', 10);
      expect(pages).toEqual([2, 3, 4, 5]);
    });

    it('should ignore invalid segments', () => {
      const pages = service.parsePageRange('1, abc, 3', 10);
      expect(pages).toEqual([1, 3]);
    });

    it('should return empty array for out-of-range single page', () => {
      const pages = service.parsePageRange('99', 10);
      expect(pages).toEqual([]);
    });

    it('should return empty array for no valid pages', () => {
      const pages = service.parsePageRange('abc, xyz', 10);
      expect(pages).toEqual([]);
    });
  });

  describe('sanitizeFileName', () => {
    it('should remove file extension', () => {
      const result = service.sanitizeFileName('document.pdf');
      expect(result).toBe('document');
    });

    it('should replace special chars with underscores and trim trailing', () => {
      const result = service.sanitizeFileName('my file@#$%.pdf');
      expect(result).toBe('my_file');
    });

    it('should trim leading/trailing underscores', () => {
      const result = service.sanitizeFileName('__test__');
      expect(result).toBe('test');
    });

    it('should return default name for empty string', () => {
      const result = service.sanitizeFileName('');
      expect(result).toBe('exported');
    });
  });

  describe('formatFileSize', () => {
    it('should return "0 B" for 0 bytes', () => {
      expect(service.formatFileSize(0)).toBe('0 B');
    });

    it('should format bytes', () => {
      expect(service.formatFileSize(500)).toContain('B');
    });

    it('should format KB', () => {
      const result = service.formatFileSize(2048);
      expect(result).toContain('KB');
      expect(result).toContain('2.00');
    });

    it('should format MB', () => {
      const result = service.formatFileSize(1048576);
      expect(result).toContain('MB');
      expect(result).toContain('1.00');
    });
  });

  it('should return progress Observable', () => {
    const progress$ = service.getProgress();
    expect(progress$).toBeTruthy();
  });

  it('should cancel export and reset progress', () => {
    service.cancelExport();
    let emittedValue: any = 'not-set';
    service.getProgress().subscribe(value => {
      emittedValue = value;
    });
    expect(emittedValue).toBeNull();
  });
});