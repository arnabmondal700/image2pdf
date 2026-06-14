import { TestBed } from '@angular/core/testing';
import { PdfProtectionService } from './pdf-protection.service';
import { FileObject } from './file.service';
import { vi } from 'vitest';

// Mock qpdf-run module
vi.mock('qpdf-run', () => ({
  createQpdfRunner: vi.fn().mockResolvedValue({
    runOne: vi.fn().mockImplementation(async ({ input, args }) => {
      // Simulate encryption/decryption by returning modified bytes
      // In real tests, the WASM module would process the PDF
      const result = new Uint8Array(input);
      return result;
    }),
    destroy: vi.fn().mockResolvedValue(undefined)
  }),
  toUint8Array: vi.fn((bytes: Uint8Array | ArrayBuffer) => {
    if (bytes instanceof Uint8Array) return bytes;
    if (bytes instanceof ArrayBuffer) return new Uint8Array(bytes);
    return new Uint8Array(bytes);
  })
}));

describe('PdfProtectionService', () => {
  let service: PdfProtectionService;
  let mockPdfFile: FileObject;

  beforeEach(() => {
    vi.restoreAllMocks();

    TestBed.configureTestingModule({
      providers: [PdfProtectionService]
    });
    service = TestBed.inject(PdfProtectionService);

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

  describe('addPassword', () => {
    it('should encrypt PDF with user password', async () => {
      const result = await service.addPassword(mockPdfFile, {
        userPassword: 'mypassword'
      });

      expect(result).toBeDefined();
      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.blob.type).toBe('application/pdf');
      expect(result.protectedName).toBe('test-protected');
    });

    it('should encrypt PDF with both user and owner passwords', async () => {
      const result = await service.addPassword(mockPdfFile, {
        userPassword: 'userpass',
        ownerPassword: 'ownerpass',
        permissions: {
          canPrint: true,
          canCopy: false,
          canModify: false
        }
      });

      expect(result).toBeDefined();
      expect(result.blob).toBeInstanceOf(Blob);
    });

    it('should throw error when no PDF file provided', async () => {
      await expect(
        service.addPassword(null as any, { userPassword: 'test' })
      ).rejects.toThrow('No PDF file provided');
    });

    it('should throw error when no password provided', async () => {
      await expect(
        service.addPassword(mockPdfFile, {})
      ).rejects.toThrow('At least one password (user or owner) must be provided');
    });

    it('should use custom file name when provided', async () => {
      const result = await service.addPassword(
        mockPdfFile,
        { userPassword: 'test' },
        'my-protected-file'
      );

      expect(result.protectedName).toBe('my-protected-file');
    });
  });

  describe('removePassword', () => {
    it('should decrypt PDF with correct password', async () => {
      const result = await service.removePassword(mockPdfFile, 'correctpassword');

      expect(result).toBeDefined();
      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.blob.type).toBe('application/pdf');
      expect(result.protectedName).toBe('test-decrypted');
    });

    it('should throw error when no PDF file provided', async () => {
      await expect(
        service.removePassword(null as any, 'test')
      ).rejects.toThrow('No PDF file provided');
    });

    it('should throw error when no password provided', async () => {
      await expect(
        service.removePassword(mockPdfFile, '')
      ).rejects.toThrow('Current password is required to decrypt the PDF');
    });

    it('should use custom file name when provided', async () => {
      const result = await service.removePassword(
        mockPdfFile,
        'test',
        'my-decrypted-file'
      );

      expect(result.protectedName).toBe('my-decrypted-file');
    });
  });

  describe('isPasswordProtected', () => {
    it('should return false for unprotected PDF', async () => {
      const result = await service.isPasswordProtected(mockPdfFile);
      expect(result).toBe(false);
    });

    it('should return false for null input', async () => {
      const result = await service.isPasswordProtected(null as any);
      expect(result).toBe(false);
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
      expect(linkElement.download).toBe('protected-document.pdf');
    });
  });
});